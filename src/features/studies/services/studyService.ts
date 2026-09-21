import { http } from '@/shared/http'
import type { CreateStudyInput, Study, UpdateStudyInput } from '../domain/study'

export const studyService = {
  list() {
    return http<{ items: Study[] }>('/studies')
  },
  create(body: CreateStudyInput) {
    return http<Study>('/studies', { method: 'POST', body })
  },
  getById(studyId: string) {
    return http<Study>(`/studies/${studyId}`)
  },
  update(studyId: string, body: UpdateStudyInput) {
    return http<Study>(`/studies/${studyId}`, { method: 'PATCH', body })
  },
}
