export { englishCoachRoutes } from './routes'
export type {
  PracticeMode,
  CoachReply,
  ChatMessage,
  GrammarFeedback,
  IdiomTip,
} from './domain/coach'
export { isPracticeMode, PRACTICE_MODES } from './domain/coach'

import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

export const englishCoachMessages = {
  'pt-BR': ptBR,
  en,
}
