<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { PracticeMode } from '../domain/coach'
import { useEnglishCoachCopy } from '../composables/useEnglishCoachCopy'
import {
  isBlockingSpeechError,
  useSpeechCoach,
} from '../composables/useSpeechCoach'
import { useCoachStore } from '../stores/coachStore'
import { pullCommandFor } from '../services/ollamaConfig'
import GrammarFeedbackPanel from './GrammarFeedbackPanel.vue'

/** Presses shorter than this are treated as tap-to-toggle, not hold-to-talk. */
const HOLD_THRESHOLD_MS = 280

const props = defineProps<{
  mode: PracticeMode
}>()

const { tc: t } = useEnglishCoachCopy()
const coach = useCoachStore()
const {
  listening,
  speaking,
  interimTranscript,
  finalTranscript,
  speechError,
  support,
  startListening,
  stopListening,
  setHoldMode,
  speak,
  stopSpeaking,
} = useSpeechCoach()

const textFallbackOpen = ref(false)
const draft = ref('')
const modelDraft = ref(coach.modelName)
const holdActive = ref(false)
const suppressClick = ref(false)
const pressStartedAt = ref(0)
const wasListeningOnDown = ref(false)
const micBusy = ref(false)
const pressGen = ref(0)
const releaseWhileStarting = { kind: 'none' as 'none' | 'tap' | 'hold' }

const statusLabel = computed(() => {
  if (coach.isThinking) return t('englishCoach.statusThinking')
  if (listening.value) return t('englishCoach.statusListening')
  if (speaking.value) return t('englishCoach.statusSpeaking')
  return t('englishCoach.statusReady')
})

const liveTranscript = computed(() => {
  if (listening.value) {
    return (
      `${finalTranscript.value} ${interimTranscript.value}`.trim() ||
      t('englishCoach.listeningHint')
    )
  }
  return coach.lastUserTranscript
})

const healthBanner = computed(() => {
  if (coach.demoMode) {
    return {
      tone: 'demo' as const,
      title: t('englishCoach.demoBannerTitle'),
      body: t('englishCoach.demoBannerBody'),
    }
  }
  const h = coach.health
  if (h.status === 'unreachable') {
    return {
      tone: 'warn' as const,
      title: t('englishCoach.ollamaDownTitle'),
      body: t('englishCoach.ollamaDownBody'),
      command: 'ollama serve',
    }
  }
  if (h.status === 'model_missing') {
    return {
      tone: 'warn' as const,
      title: t('englishCoach.modelMissingTitle'),
      body: t('englishCoach.modelMissingBody'),
      command: h.pullCommand,
    }
  }
  if (h.status === 'ok') {
    return {
      tone: 'ok' as const,
      title: t('englishCoach.ollamaOkTitle'),
      body: t('englishCoach.ollamaOkBody').replace('{model}', h.model),
    }
  }
  return null
})

const speechBlockedReason = computed(() => {
  if (!support.value.recognition) return t('englishCoach.speechUnsupported')
  if (!support.value.secureContext) return t('englishCoach.speechInsecure')
  if (speechError.value === 'not-allowed' || speechError.value === 'service-not-allowed') {
    return t('englishCoach.speechDenied')
  }
  if (speechError.value === 'no-microphone') {
    return t('englishCoach.speechGenericError')
  }
  if (isBlockingSpeechError(speechError.value)) {
    return t('englishCoach.speechGenericError')
  }
  return null
})

onMounted(() => {
  coach.ensureSession(props.mode)
  modelDraft.value = coach.modelName
  void speak(coach.prompt)
})

watch(
  () => props.mode,
  (mode) => {
    coach.ensureSession(mode)
    stopSpeaking()
    void speak(coach.prompt)
  },
)

watch(
  () => coach.modelName,
  (value) => {
    modelDraft.value = value
  },
)

async function handleUtterance(text: string) {
  const reply = await coach.submitUtterance(text)
  if (reply?.spoken) {
    await speak(reply.spoken)
  }
}

function armClickSuppress() {
  suppressClick.value = true
  window.setTimeout(() => {
    suppressClick.value = false
  }, 280)
}

async function finishUtteranceFromMic() {
  const text = stopListening()
  if (text) await handleUtterance(text)
}

async function onMicPointerDown(event: PointerEvent) {
  if (coach.isThinking || micBusy.value) return
  if (speechBlockedReason.value) {
    textFallbackOpen.value = true
    return
  }

  // Barge-in: let the learner interrupt coach TTS immediately.
  if (speaking.value) {
    stopSpeaking()
  }

  const gen = pressGen.value + 1
  pressGen.value = gen
  wasListeningOnDown.value = listening.value
  pressStartedAt.value = Date.now()
  holdActive.value = true
  releaseWhileStarting.kind = 'none'
  suppressClick.value = false
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)

  if (listening.value) {
    // Already in tap-to-talk; release will stop + submit.
    return
  }

  micBusy.value = true
  try {
    await startListening({ hold: true })
    if (pressGen.value !== gen) return

    // Re-read after await — pointerup may have flipped this while permission resolved.
    const release = releaseWhileStarting.kind as 'none' | 'tap' | 'hold'
    if (release === 'hold') {
      await finishUtteranceFromMic()
    } else if (release === 'tap') {
      // Short press while permission/start was in flight: stay in toggle-on mode.
      setHoldMode(false)
    }
  } finally {
    if (pressGen.value === gen) micBusy.value = false
  }
}

async function onMicPointerUp() {
  if (!holdActive.value && releaseWhileStarting.kind === 'none') return

  const heldMs = Date.now() - pressStartedAt.value
  const isHold = heldMs >= HOLD_THRESHOLD_MS
  armClickSuppress()

  // Start still pending (permission prompt / recognition boot).
  if (micBusy.value && !wasListeningOnDown.value) {
    holdActive.value = false
    releaseWhileStarting.kind = isHold ? 'hold' : 'tap'
    return
  }

  if (!holdActive.value) return
  holdActive.value = false

  if (wasListeningOnDown.value || isHold) {
    await finishUtteranceFromMic()
    return
  }

  // Short tap: keep recognition running in toggle mode.
  setHoldMode(false)
}

function onMicClick() {
  // Pointer handlers own the interaction; click is a no-op backup for
  // assistive tech that synthesized a click without pointer events.
  if (suppressClick.value || holdActive.value || micBusy.value) return
  if (coach.isThinking) return
  if (speechBlockedReason.value) {
    textFallbackOpen.value = true
    return
  }
  if (speaking.value) stopSpeaking()
  if (listening.value) {
    void finishUtteranceFromMic()
    return
  }
  void startListening({ hold: false })
}

async function onTextSubmit() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  textFallbackOpen.value = false
  await handleUtterance(text)
}

function refreshPrompt() {
  stopSpeaking()
  coach.startSession(props.mode)
  void speak(coach.prompt)
}

function applyModel() {
  coach.setModel(modelDraft.value.trim() || coach.modelName)
}

function toggleDemo() {
  coach.setDemoMode(!coach.demoMode)
}
</script>

<template>
  <section class="me-voice" aria-label="Voice English coach">
    <header class="me-voice__toolbar">
      <div>
        <p class="me-voice__eyebrow">{{ t('englishCoach.practiceTitle') }}</p>
        <p class="me-voice__hint">{{ t('englishCoach.voiceHint') }}</p>
      </div>
      <div class="me-voice__actions">
        <button type="button" class="me-voice__ghost" @click="refreshPrompt">
          <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
          {{ t('englishCoach.newSession') }}
        </button>
        <button type="button" class="me-voice__ghost" @click="toggleDemo">
          {{
            coach.demoMode
              ? t('englishCoach.disableDemo')
              : t('englishCoach.enableDemo')
          }}
        </button>
      </div>
    </header>

    <aside
      v-if="healthBanner"
      class="me-voice__banner"
      :class="`me-voice__banner--${healthBanner.tone}`"
      role="status"
    >
      <p class="me-voice__banner-title">{{ healthBanner.title }}</p>
      <p class="me-voice__banner-body">{{ healthBanner.body }}</p>
      <code v-if="healthBanner.command" class="me-voice__command">{{
        healthBanner.command
      }}</code>
      <p v-if="!coach.demoMode" class="me-voice__model-row">
        <label for="me-model">{{ t('englishCoach.modelLabel') }}</label>
        <input
          id="me-model"
          v-model="modelDraft"
          type="text"
          spellcheck="false"
          @keydown.enter.prevent="applyModel"
        />
        <button type="button" class="me-voice__ghost" @click="applyModel">
          {{ t('englishCoach.modelApply') }}
        </button>
      </p>
      <p class="me-voice__pull-hint">
        {{ t('englishCoach.pullHint') }}
        <code>{{ pullCommandFor(coach.modelName) }}</code>
      </p>
    </aside>

    <div class="me-voice__stage">
      <p class="me-voice__status">{{ statusLabel }}</p>
      <p class="me-voice__prompt">{{ coach.prompt }}</p>

      <button
        type="button"
        class="me-mic"
        :class="{
          'is-listening': listening,
          'is-thinking': coach.isThinking,
          'is-speaking': speaking,
          'is-disabled': coach.isThinking,
        }"
        :aria-pressed="listening"
        :aria-label="t('englishCoach.micAria')"
        :disabled="coach.isThinking"
        @pointerdown.prevent="onMicPointerDown"
        @pointerup.prevent="onMicPointerUp"
        @pointercancel.prevent="onMicPointerUp"
        @click.prevent="onMicClick"
      >
        <span class="me-mic__pulse" aria-hidden="true" />
        <span class="material-symbols-outlined me-mic__icon" aria-hidden="true">mic</span>
      </button>

      <p class="me-voice__mic-caption">{{ t('englishCoach.micCaption') }}</p>

      <p v-if="liveTranscript" class="me-voice__transcript">
        <span class="me-voice__transcript-label">{{ t('englishCoach.youSaid') }}</span>
        {{ liveTranscript }}
      </p>

      <p v-if="speechBlockedReason" class="me-voice__speech-warn" role="note">
        {{ speechBlockedReason }}
        <button type="button" class="me-voice__link" @click="textFallbackOpen = true">
          {{ t('englishCoach.useTextFallback') }}
        </button>
      </p>
      <button
        v-else
        type="button"
        class="me-voice__link"
        @click="textFallbackOpen = !textFallbackOpen"
      >
        {{
          textFallbackOpen
            ? t('englishCoach.hideTextFallback')
            : t('englishCoach.showTextFallback')
        }}
      </button>
    </div>

    <form
      v-if="textFallbackOpen"
      class="me-voice__text"
      @submit.prevent="onTextSubmit"
    >
      <label class="sr-only" for="me-text-fallback">{{
        t('englishCoach.composerPlaceholder')
      }}</label>
      <textarea
        id="me-text-fallback"
        v-model="draft"
        rows="3"
        :placeholder="t('englishCoach.composerPlaceholder')"
        :disabled="coach.isThinking"
      />
      <button type="submit" class="me-voice__send" :disabled="coach.isThinking || !draft.trim()">
        {{ t('englishCoach.composerSend') }}
      </button>
    </form>

    <div v-if="coach.lastReply" class="me-voice__feedback">
      <GrammarFeedbackPanel
        v-if="coach.lastReply.feedback"
        :original="coach.lastReply.feedback.original"
        :correction="coach.lastReply.feedback.correction"
        :native-alternative="coach.lastReply.feedback.nativeAlternative"
        :title="t('englishCoach.feedbackTitle')"
        :original-label="t('englishCoach.feedbackOriginal')"
        :correction-label="t('englishCoach.feedbackCorrection')"
        :native-label="t('englishCoach.feedbackNative')"
      />
      <p v-if="coach.lastReply.idiom" class="me-voice__idiom">
        <span class="me-voice__idiom-label">{{ t('englishCoach.idiomLabel') }}:</span>
        <strong>{{ coach.lastReply.idiom.term }}</strong>
        — {{ coach.lastReply.idiom.meaning }}
      </p>
    </div>

    <p v-if="coach.error" class="me-voice__error" role="alert">
      {{ t('englishCoach.errorUnavailable') }}
    </p>
  </section>
</template>

<style scoped>
.me-voice {
  display: grid;
  gap: 1.1rem;
  min-height: min(78vh, 48rem);
}

.me-voice__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.me-voice__eyebrow {
  margin: 0;
  font-family: var(--me-font-display);
  font-size: 1.15rem;
  font-weight: 700;
}

.me-voice__hint {
  margin: 0.3rem 0 0;
  color: var(--me-muted-fg);
  font-size: 0.92rem;
  max-width: 34rem;
  line-height: 1.45;
}

.me-voice__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.me-voice__ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 35%, transparent);
  background: transparent;
  color: var(--me-teal);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.me-voice__banner {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 30%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 88%, transparent);
}

.me-voice__banner--warn {
  border-color: color-mix(in srgb, var(--me-gold) 50%, transparent);
}

.me-voice__banner--demo {
  border-color: color-mix(in srgb, #8eb7ff 45%, transparent);
}

.me-voice__banner--ok {
  border-color: color-mix(in srgb, var(--me-teal) 55%, transparent);
}

.me-voice__banner-title {
  margin: 0;
  font-weight: 700;
}

.me-voice__banner-body,
.me-voice__pull-hint {
  margin: 0.35rem 0 0;
  color: var(--me-muted-fg);
  font-size: 0.9rem;
  line-height: 1.45;
}

.me-voice__command {
  display: inline-block;
  margin-top: 0.55rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.45rem;
  background: rgba(0, 0, 0, 0.28);
  color: var(--me-gold);
  font-size: 0.85rem;
}

.me-voice__model-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin: 0.75rem 0 0;
  font-size: 0.88rem;
}

.me-voice__model-row input {
  flex: 1 1 12rem;
  min-width: 10rem;
  border-radius: 0.55rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 30%, transparent);
  background: rgba(0, 0, 0, 0.22);
  color: var(--me-fg);
  padding: 0.45rem 0.65rem;
  font: inherit;
}

.me-voice__stage {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.85rem;
  padding: 1.4rem 0.5rem 0.5rem;
}

.me-voice__status {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--me-teal);
}

.me-voice__prompt {
  margin: 0;
  max-width: 36rem;
  font-family: var(--me-font-display);
  font-size: clamp(1.15rem, 2.6vw, 1.55rem);
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.me-mic {
  position: relative;
  width: min(42vw, 9.5rem);
  height: min(42vw, 9.5rem);
  border-radius: 50%;
  border: 0;
  margin-top: 0.4rem;
  color: #041018;
  background: linear-gradient(145deg, var(--me-teal), #8af0dd 55%, var(--me-gold));
  box-shadow:
    0 18px 50px rgba(61, 224, 197, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  display: grid;
  place-items: center;
  transition:
    transform 180ms ease,
    filter 180ms ease;
  touch-action: none;
  user-select: none;
}

.me-mic:hover:not(:disabled) {
  transform: scale(1.03);
}

.me-mic:disabled {
  filter: grayscale(0.25) brightness(0.85);
}

.me-mic__icon {
  font-size: 3rem !important;
  position: relative;
  z-index: 1;
}

.me-mic__pulse {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--me-teal) 55%, transparent);
  opacity: 0;
}

.me-mic.is-listening .me-mic__pulse,
.me-mic.is-speaking .me-mic__pulse {
  animation: me-mic-pulse 1.4s ease-out infinite;
  opacity: 1;
}

.me-mic.is-listening {
  background: linear-gradient(145deg, #ff9d7a, var(--me-gold));
}

.me-mic.is-thinking {
  animation: me-mic-think 1.1s ease-in-out infinite;
}

.me-voice__mic-caption {
  margin: 0;
  color: var(--me-muted-fg);
  font-size: 0.9rem;
}

.me-voice__transcript {
  margin: 0.25rem 0 0;
  max-width: 34rem;
  color: var(--me-fg);
  font-size: 0.95rem;
  line-height: 1.45;
}

.me-voice__transcript-label {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--me-muted-fg);
}

.me-voice__speech-warn {
  margin: 0;
  max-width: 32rem;
  color: #ffb4a8;
  font-size: 0.9rem;
  line-height: 1.45;
}

.me-voice__link {
  border: 0;
  background: transparent;
  color: var(--me-teal);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.18em;
  padding: 0;
}

.me-voice__text {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  border-radius: 1.1rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 28%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 90%, black);
}

.me-voice__text textarea {
  width: 100%;
  border: 0;
  outline: none;
  resize: vertical;
  min-height: 4rem;
  background: transparent;
  color: var(--me-fg);
  font: inherit;
  line-height: 1.5;
}

.me-voice__send {
  justify-self: end;
  border: 0;
  border-radius: 999px;
  padding: 0.65rem 1.1rem;
  font-weight: 700;
  color: #041018;
  background: linear-gradient(135deg, var(--me-teal), #7ee7d4);
}

.me-voice__feedback {
  display: grid;
  gap: 0.75rem;
}

.me-voice__idiom {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 28%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 90%, transparent);
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--me-muted-fg);
}

.me-voice__idiom-label {
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--me-teal);
  margin-right: 0.35rem;
}

.me-voice__error {
  margin: 0;
  color: #ff8f8f;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes me-mic-pulse {
  from {
    transform: scale(0.92);
    opacity: 0.7;
  }
  to {
    transform: scale(1.18);
    opacity: 0;
  }
}

@keyframes me-mic-think {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.15);
  }
}

@media (max-width: 640px) {
  .me-voice__toolbar {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .me-mic,
  .me-mic__pulse,
  .me-mic.is-thinking {
    animation: none;
    transition: none;
  }
}
</style>
