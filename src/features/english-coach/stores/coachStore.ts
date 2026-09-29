import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  isPracticeMode,
  type ChatMessage,
  type PracticeMode,
} from '../domain/coach'
import { generateCoachReply, openingMessage } from '../services/coachService'

function id(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useCoachStore = defineStore('englishCoach', () => {
  const mode = ref<PracticeMode>('behavioral')
  const messages = ref<ChatMessage[]>([])
  const status = ref<'idle' | 'thinking' | 'error'>('idle')
  const error = ref<string | null>(null)
  const turnIndex = ref(0)

  const isThinking = computed(() => status.value === 'thinking')

  function startSession(nextMode: PracticeMode, salt = Date.now()) {
    mode.value = nextMode
    turnIndex.value = 0
    status.value = 'idle'
    error.value = null
    messages.value = [
      {
        id: id(),
        role: 'coach',
        text: openingMessage(nextMode, salt),
        createdAt: new Date().toISOString(),
      },
    ]
  }

  function ensureSession(rawMode: unknown) {
    const next = isPracticeMode(rawMode) ? rawMode : 'behavioral'
    if (messages.value.length === 0 || mode.value !== next) {
      startSession(next)
    }
  }

  async function sendUserMessage(raw: string) {
    const text = raw.trim()
    if (!text || status.value === 'thinking') return

    messages.value.push({
      id: id(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    })

    status.value = 'thinking'
    error.value = null
    turnIndex.value += 1

    try {
      const reply = await generateCoachReply({
        mode: mode.value,
        userText: text,
        turnIndex: turnIndex.value,
      })
      messages.value.push({
        id: id(),
        role: 'coach',
        text: reply.message,
        feedback: reply.feedback,
        idiom: reply.idiom,
        createdAt: new Date().toISOString(),
      })
      status.value = 'idle'
    } catch {
      status.value = 'error'
      error.value = 'COACH_UNAVAILABLE'
    }
  }

  return {
    mode,
    messages,
    status,
    error,
    isThinking,
    startSession,
    ensureSession,
    sendUserMessage,
  }
})
