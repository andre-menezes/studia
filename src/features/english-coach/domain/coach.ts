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
  message: string
  feedback: GrammarFeedback | null
  idiom: IdiomTip | null
}

export type ChatRole = 'coach' | 'user'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  feedback?: GrammarFeedback | null
  idiom?: IdiomTip | null
  createdAt: string
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
