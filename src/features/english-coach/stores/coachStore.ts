import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  isPracticeMode,
  type CoachEngine,
  type CoachReply,
  type OllamaHealth,
  type PracticeMode,
} from '../domain/coach'
import {
  defaultOpener,
  generateCoachReply,
  probeCoachEngine,
} from '../services/coachService'
import {
  getOllamaModel,
  isForcedDemoMode,
  setForcedDemoMode,
  setOllamaModelPreference,
} from '../services/ollamaConfig'

export const useCoachStore = defineStore('englishCoach', () => {
  const mode = ref<PracticeMode>('behavioral')
  const prompt = ref('')
  const lastUserTranscript = ref('')
  const lastReply = ref<CoachReply | null>(null)
  const status = ref<'idle' | 'thinking' | 'error'>('idle')
  const error = ref<string | null>(null)
  const turnIndex = ref(0)
  const engine = ref<CoachEngine>('mock')
  const health = ref<OllamaHealth>({ status: 'unknown' })
  const demoMode = ref(isForcedDemoMode())
  const modelName = ref(getOllamaModel())
  const history = ref<Array<{ role: 'user' | 'coach'; text: string }>>([])

  const isThinking = computed(() => status.value === 'thinking')
  const usingMock = computed(() => engine.value === 'mock')

  async function refreshEngine() {
    modelName.value = getOllamaModel()
    demoMode.value = isForcedDemoMode()
    const probed = await probeCoachEngine()
    engine.value = probed.engine
    health.value = probed.health
  }

  function startSession(nextMode: PracticeMode, salt = Date.now()) {
    mode.value = nextMode
    turnIndex.value = 0
    status.value = 'idle'
    error.value = null
    lastUserTranscript.value = ''
    lastReply.value = null
    const opener = defaultOpener(nextMode, salt)
    prompt.value = opener
    history.value = [{ role: 'coach', text: opener }]
    void refreshEngine()
  }

  function ensureSession(rawMode: unknown) {
    const next = isPracticeMode(rawMode) ? rawMode : 'behavioral'
    if (!prompt.value || mode.value !== next) {
      startSession(next)
    } else {
      void refreshEngine()
    }
  }

  async function submitUtterance(raw: string) {
    const text = raw.trim()
    if (!text || status.value === 'thinking') return null

    lastUserTranscript.value = text
    status.value = 'thinking'
    error.value = null
    turnIndex.value += 1
    history.value.push({ role: 'user', text })

    try {
      const preferred: CoachEngine = demoMode.value ? 'mock' : 'ollama'
      const result = await generateCoachReply(
        {
          mode: mode.value,
          userText: text,
          turnIndex: turnIndex.value,
          history: history.value.slice(0, -1),
        },
        preferred,
      )
      engine.value = result.engine
      health.value = result.health
      lastReply.value = result.reply
      prompt.value = result.reply.spoken
      history.value.push({ role: 'coach', text: result.reply.spoken })
      status.value = 'idle'
      return result.reply
    } catch {
      status.value = 'error'
      error.value = 'COACH_UNAVAILABLE'
      return null
    }
  }

  function setDemoMode(enabled: boolean) {
    setForcedDemoMode(enabled)
    demoMode.value = enabled
    void refreshEngine()
  }

  function setModel(model: string) {
    setOllamaModelPreference(model)
    modelName.value = getOllamaModel()
    void refreshEngine()
  }

  return {
    mode,
    prompt,
    lastUserTranscript,
    lastReply,
    status,
    error,
    turnIndex,
    engine,
    health,
    demoMode,
    modelName,
    history,
    isThinking,
    usingMock,
    refreshEngine,
    startSession,
    ensureSession,
    submitUtterance,
    setDemoMode,
    setModel,
  }
})
