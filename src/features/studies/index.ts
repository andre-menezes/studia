export { studiesRoutes } from './routes'
export type { Study, CreateStudyInput, UpdateStudyInput } from './domain/study'

import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

export const studiesMessages = {
  'pt-BR': ptBR,
  en,
}
