export type PracticeMode = 'behavioral' | 'technical' | 'freeform'

export type GrammarFeedback = {
  original: string
  correction: string
  nativeAlternative: string
}

export type IdiomTip = {
  term: string
  meaning: string
  example: string
}

export type CoachReply = {
  /** Concise spoken coaching reply (TTS + light transcript). */
  spoken: string
  feedback: GrammarFeedback | null
  idiom: IdiomTip | null
}

export type CoachEngine = 'ollama' | 'mock'

export type OllamaHealth =
  | { status: 'ok'; model: string; models: string[] }
  | { status: 'unreachable'; detail: string }
  | { status: 'model_missing'; model: string; models: string[]; pullCommand: string }
  | { status: 'unknown' }

export type CoachTurnInput = {
  mode: PracticeMode
  userText: string
  turnIndex: number
  history?: Array<{ role: 'user' | 'coach'; text: string }>
}

export const PRACTICE_MODES: readonly PracticeMode[] = [
  'behavioral',
  'technical',
  'freeform',
] as const

export function isPracticeMode(value: unknown): value is PracticeMode {
  return (
    value === 'behavioral' ||
    value === 'technical' ||
    value === 'freeform'
  )
}

export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:14b'
