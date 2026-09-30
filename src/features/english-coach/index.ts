export { englishCoachRoutes } from './routes'
export type {
  PracticeMode,
  CoachReply,
  GrammarFeedback,
  IdiomTip,
  CoachEngine,
  OllamaHealth,
} from './domain/coach'
export { isPracticeMode, PRACTICE_MODES, DEFAULT_OLLAMA_MODEL } from './domain/coach'

import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

export const englishCoachMessages = {
  'pt-BR': ptBR,
  en,
}
