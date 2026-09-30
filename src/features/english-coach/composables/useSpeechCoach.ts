import { onBeforeUnmount, ref } from 'vue'

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>
}

type RecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type SpeechSupport = {
  recognition: boolean
  synthesis: boolean
  secureContext: boolean
}

export function useSpeechCoach() {
  const listening = ref(false)
  const speaking = ref(false)
  const interimTranscript = ref('')
  const finalTranscript = ref('')
  const speechError = ref<string | null>(null)
  const support = ref<SpeechSupport>({
    recognition: false,
    synthesis: false,
    secureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
  })

  let recognition: SpeechRecognitionLike | null = null
  let holdMode = false

  function refreshSupport() {
    support.value = {
      recognition: Boolean(getRecognitionCtor()),
      synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      secureContext:
        typeof window !== 'undefined' ? window.isSecureContext : false,
    }
  }

  refreshSupport()

  function ensureRecognition(): SpeechRecognitionLike | null {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    if (recognition) return recognition
    const instance = new Ctor()
    instance.lang = 'en-US'
    instance.continuous = false
    instance.interimResults = true
    instance.maxAlternatives = 1
    instance.onresult = (event) => {
      let interim = ''
      let finalText = finalTranscript.value
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const chunk = result?.[0]?.transcript ?? ''
        if ((result as { isFinal?: boolean }).isFinal) {
          finalText = `${finalText} ${chunk}`.trim()
        } else {
          interim += chunk
        }
      }
      interimTranscript.value = interim.trim()
      finalTranscript.value = finalText
    }
    instance.onerror = (event) => {
      speechError.value = event.error ?? 'speech_error'
      listening.value = false
    }
    instance.onend = () => {
      listening.value = false
    }
    recognition = instance
    return recognition
  }

  function startListening(options?: { hold?: boolean }) {
    refreshSupport()
    speechError.value = null
    if (!support.value.secureContext) {
      speechError.value = 'insecure_context'
      return false
    }
    const rec = ensureRecognition()
    if (!rec) {
      speechError.value = 'unsupported'
      return false
    }
    holdMode = Boolean(options?.hold)
    interimTranscript.value = ''
    finalTranscript.value = ''
    try {
      rec.start()
      listening.value = true
      return true
    } catch {
      speechError.value = 'start_failed'
      listening.value = false
      return false
    }
  }

  function stopListening(): string {
    const rec = recognition
    if (rec && listening.value) {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
    listening.value = false
    const text = `${finalTranscript.value} ${interimTranscript.value}`.trim()
    interimTranscript.value = ''
    return text
  }

  function cancelListening() {
    holdMode = false
    if (recognition) {
      try {
        recognition.abort()
      } catch {
        /* ignore */
      }
    }
    listening.value = false
    interimTranscript.value = ''
  }

  function pickEnglishVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis?.getVoices?.() ?? []
    return (
      voices.find((v) => /^en(-|_)/i.test(v.lang) && /US|GB|AU/i.test(v.lang)) ??
      voices.find((v) => /^en/i.test(v.lang)) ??
      null
    )
  }

  function speak(text: string): Promise<void> {
    refreshSupport()
    if (!support.value.synthesis || !text.trim()) {
      return Promise.resolve()
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    speaking.value = true
    return new Promise((resolve) => {
      utterance.onend = () => {
        speaking.value = false
        resolve()
      }
      utterance.onerror = () => {
        speaking.value = false
        resolve()
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  function stopSpeaking() {
    if (support.value.synthesis) {
      window.speechSynthesis.cancel()
    }
    speaking.value = false
  }

  onBeforeUnmount(() => {
    cancelListening()
    stopSpeaking()
  })

  return {
    listening,
    speaking,
    interimTranscript,
    finalTranscript,
    speechError,
    support,
    holdMode: () => holdMode,
    refreshSupport,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
  }
}
