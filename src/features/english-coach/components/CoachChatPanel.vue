<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { PracticeMode } from '../domain/coach'
import { useEnglishCoachCopy } from '../composables/useEnglishCoachCopy'
import { useCoachStore } from '../stores/coachStore'
import CoachMessageBubble from './CoachMessageBubble.vue'

const props = defineProps<{
  mode: PracticeMode
}>()

const { tc: t } = useEnglishCoachCopy()
const coach = useCoachStore()
const draft = ref('')
const listEl = ref<HTMLElement | null>(null)

onMounted(() => {
  coach.ensureSession(props.mode)
})

watch(
  () => props.mode,
  (mode) => {
    coach.ensureSession(mode)
  },
)

watch(
  () => coach.messages.length,
  async () => {
    await nextTick()
    if (listEl.value) {
      listEl.value.scrollTop = listEl.value.scrollHeight
    }
  },
)

async function onSubmit() {
  const text = draft.value
  if (!text.trim()) return
  draft.value = ''
  await coach.sendUserMessage(text)
}

function refreshPrompt() {
  coach.startSession(props.mode)
}
</script>

<template>
  <section class="me-chat" aria-label="English coach chat">
    <header class="me-chat__toolbar">
      <div>
        <p class="me-chat__eyebrow">{{ t('englishCoach.practiceTitle') }}</p>
        <p class="me-chat__hint">{{ t('englishCoach.practiceHint') }}</p>
      </div>
      <button type="button" class="me-chat__ghost" @click="refreshPrompt">
        <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
        {{ t('englishCoach.newSession') }}
      </button>
    </header>

    <div ref="listEl" class="me-chat__list studia-scrollbar" role="log" aria-live="polite">
      <CoachMessageBubble
        v-for="message in coach.messages"
        :key="message.id"
        :message="message"
        :feedback-title="t('englishCoach.feedbackTitle')"
        :original-label="t('englishCoach.feedbackOriginal')"
        :correction-label="t('englishCoach.feedbackCorrection')"
        :native-label="t('englishCoach.feedbackNative')"
        :idiom-label="t('englishCoach.idiomLabel')"
      />
      <p v-if="coach.isThinking" class="me-chat__thinking">
        {{ t('englishCoach.composerThinking') }}
      </p>
      <p v-if="coach.error" class="me-chat__error" role="alert">
        {{ t('englishCoach.errorUnavailable') }}
      </p>
    </div>

    <form class="me-chat__composer" @submit.prevent="onSubmit">
      <label class="sr-only" for="me-composer">{{ t('englishCoach.composerPlaceholder') }}</label>
      <textarea
        id="me-composer"
        v-model="draft"
        rows="3"
        :placeholder="t('englishCoach.composerPlaceholder')"
        :disabled="coach.isThinking"
        @keydown.enter.exact.prevent="onSubmit"
      />
      <button type="submit" class="me-chat__send" :disabled="coach.isThinking || !draft.trim()">
        <span class="material-symbols-outlined" aria-hidden="true">send</span>
        {{ t('englishCoach.composerSend') }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.me-chat {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 1rem;
  min-height: min(70vh, 44rem);
}

.me-chat__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.me-chat__eyebrow {
  margin: 0;
  font-family: var(--me-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--me-fg);
}

.me-chat__hint {
  margin: 0.25rem 0 0;
  max-width: 36rem;
  color: var(--me-muted-fg);
  font-size: 0.92rem;
  line-height: 1.45;
}

.me-chat__ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 35%, transparent);
  background: transparent;
  color: var(--me-teal);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.me-chat__ghost:hover {
  background: color-mix(in srgb, var(--me-teal) 12%, transparent);
}

.me-chat__list {
  display: grid;
  align-content: start;
  gap: 0.85rem;
  overflow: auto;
  padding: 0.25rem 0.15rem 0.5rem;
  min-height: 16rem;
}

.me-chat__thinking,
.me-chat__error {
  margin: 0;
  font-size: 0.9rem;
  color: var(--me-muted-fg);
}

.me-chat__error {
  color: #ff8f8f;
}

.me-chat__composer {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--me-teal) 28%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 90%, black);
}

.me-chat__composer textarea {
  width: 100%;
  resize: vertical;
  min-height: 4.5rem;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--me-fg);
  font: inherit;
  line-height: 1.5;
}

.me-chat__composer textarea::placeholder {
  color: color-mix(in srgb, var(--me-muted-fg) 80%, transparent);
}

.me-chat__send {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1.15rem;
  font-weight: 700;
  color: #041018;
  background: linear-gradient(135deg, var(--me-teal), #7ee7d4);
}

.me-chat__send:disabled {
  opacity: 0.45;
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

@media (max-width: 640px) {
  .me-chat__toolbar {
    flex-direction: column;
  }
}
</style>
