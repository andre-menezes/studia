<script setup lang="ts">
import type { ChatMessage } from '../domain/coach'
import GrammarFeedbackPanel from './GrammarFeedbackPanel.vue'

defineProps<{
  message: ChatMessage
  feedbackTitle: string
  originalLabel: string
  correctionLabel: string
  nativeLabel: string
  idiomLabel: string
}>()
</script>

<template>
  <article
    class="me-bubble"
    :class="message.role === 'coach' ? 'me-bubble--coach' : 'me-bubble--user'"
  >
    <p class="me-bubble__text">{{ message.text }}</p>

    <GrammarFeedbackPanel
      v-if="message.role === 'coach' && message.feedback"
      :original="message.feedback.original"
      :correction="message.feedback.correction"
      :native-alternative="message.feedback.nativeAlternative"
      :title="feedbackTitle"
      :original-label="originalLabel"
      :correction-label="correctionLabel"
      :native-label="nativeLabel"
    />

    <p
      v-if="message.role === 'coach' && message.idiom"
      class="me-bubble__idiom"
    >
      <span class="me-bubble__idiom-label">{{ idiomLabel }}:</span>
      <strong>{{ message.idiom.term }}</strong>
      — {{ message.idiom.meaning }}
    </p>
  </article>
</template>

<style scoped>
.me-bubble {
  max-width: min(40rem, 100%);
  padding: 1rem 1.1rem;
  border-radius: 1.1rem;
  animation: me-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.me-bubble--coach {
  justify-self: start;
  background: color-mix(in srgb, var(--me-ink-elevated) 92%, var(--me-teal) 8%);
  border: 1px solid color-mix(in srgb, var(--me-teal) 28%, transparent);
  box-shadow: 0 12px 40px rgba(4, 12, 24, 0.28);
}

.me-bubble--user {
  justify-self: end;
  background: color-mix(in srgb, var(--me-teal) 22%, var(--me-ink-elevated));
  border: 1px solid color-mix(in srgb, var(--me-teal) 45%, transparent);
}

.me-bubble__text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--me-fg);
}

.me-bubble__idiom {
  margin: 0.85rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--me-teal) 25%, transparent);
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--me-muted-fg);
}

.me-bubble__idiom-label {
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--me-teal);
  margin-right: 0.35rem;
}

@keyframes me-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .me-bubble {
    animation: none;
  }
}
</style>
