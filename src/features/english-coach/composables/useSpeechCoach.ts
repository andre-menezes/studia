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
  onstart: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>
}

type RecognitionCtor = new () => SpeechRecognitionLike

/** Errors that should not permanently disable the mic UI. */
const TRANSIENT_SPEECH_ERRORS = new Set([
  'no-speech',
  'aborted',
  'audio-capture',
  'network',
  'start_failed',
])

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

export function isBlockingSpeechError(error: string | null | undefined): boolean {
  if (!error) return false
  return (
    error === 'not-allowed' ||
    error === 'service-not-allowed' ||
    error === 'unsupported' ||
    error === 'insecure_context' ||
    error === 'no-microphone'
  )
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
  let shouldBeListening = false

  function refreshSupport() {
    support.value = {
      recognition: Boolean(getRecognitionCtor()),
      synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      secureContext:
        typeof window !== 'undefined' ? window.isSecureContext : false,
    }
  }

  refreshSupport()

  function disposeRecognition() {
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.onstart = null
    try {
      recognition.abort()
    } catch {
      /* ignore */
    }
    recognition = null
  }

  async function ensureMicPermission(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return true
    try {
      // Prompt for mic access on a user gesture, then release immediately so
      // SpeechRecognition can open the device itself (holding the stream blocks it).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      for (const track of stream.getTracks()) track.stop()
      return true
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        speechError.value = 'not-allowed'
        return false
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        speechError.value = 'no-microphone'
        return false
      }
      // Other getUserMedia failures should not block SpeechRecognition itself.
      return true
    }
  }

  function ensureRecognition(): SpeechRecognitionLike | null {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    if (recognition) return recognition
    const instance = new Ctor()
    instance.lang = 'en-US'
    instance.continuous = false
    instance.interimResults = true
    instance.maxAlternatives = 1
    instance.onstart = () => {
      listening.value = true
    }
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
      const code = event.error ?? 'speech_error'
      // no-speech / aborted are normal when the user stops quickly or cancels.
      if (!TRANSIENT_SPEECH_ERRORS.has(code)) {
        speechError.value = code
      }
      listening.value = false
      shouldBeListening = false
    }
    instance.onend = () => {
      listening.value = false
      // Chrome ends recognition after a pause even in non-continuous mode.
      // Keep listening only when the user explicitly toggled tap-to-talk on.
      if (shouldBeListening && !holdMode) {
        try {
          instance.start()
          listening.value = true
        } catch {
          disposeRecognition()
          const next = ensureRecognition()
          if (next && shouldBeListening) {
            try {
              next.start()
              listening.value = true
            } catch {
              shouldBeListening = false
              speechError.value = 'start_failed'
            }
          }
        }
      } else {
        shouldBeListening = false
      }
    }
    recognition = instance
    return recognition
  }

  async function startListening(options?: { hold?: boolean }): Promise<boolean> {
    refreshSupport()
    speechError.value = null
    if (!support.value.secureContext) {
      speechError.value = 'insecure_context'
      return false
    }
    if (!getRecognitionCtor()) {
      speechError.value = 'unsupported'
      return false
    }

    const permitted = await ensureMicPermission()
    if (!permitted) return false

    // Recreate if a previous session left the instance in a bad state.
    let rec = ensureRecognition()
    if (!rec) {
      speechError.value = 'unsupported'
      return false
    }

    holdMode = Boolean(options?.hold)
    shouldBeListening = true
    interimTranscript.value = ''
    finalTranscript.value = ''

    try {
      rec.start()
      listening.value = true
      return true
    } catch {
      // InvalidStateError if already started — reset and retry once.
      disposeRecognition()
      rec = ensureRecognition()
      if (!rec) {
        speechError.value = 'start_failed'
        listening.value = false
        shouldBeListening = false
        return false
      }
      try {
        rec.start()
        listening.value = true
        return true
      } catch {
        speechError.value = 'start_failed'
        listening.value = false
        shouldBeListening = false
        return false
      }
    }
  }

  function stopListening(): string {
    shouldBeListening = false
    holdMode = false
    const rec = recognition
    if (rec) {
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
    shouldBeListening = false
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
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        speaking.value = false
        resolve()
      }
      utterance.onend = finish
      utterance.onerror = finish
      // Guard against rare macOS cases where onend never fires.
      window.setTimeout(finish, Math.min(30000, Math.max(4000, text.length * 80)))
      window.speechSynthesis.speak(utterance)
    })
  }

  function stopSpeaking() {
    if (support.value.synthesis) {
      window.speechSynthesis.cancel()
    }
    speaking.value = false
  }

  function setHoldMode(next: boolean) {
    holdMode = next
  }

  onBeforeUnmount(() => {
    cancelListening()
    stopSpeaking()
    disposeRecognition()
  })

  return {
    listening,
    speaking,
    interimTranscript,
    finalTranscript,
    speechError,
    support,
    holdMode: () => holdMode,
    setHoldMode,
    refreshSupport,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    isBlockingSpeechError,
  }
}
