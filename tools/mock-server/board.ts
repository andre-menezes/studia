import type { Study, StudyStatus } from './db'

export const STUDY_STATUSES: StudyStatus[] = ['CREATED', 'STARTED', 'PAUSED', 'COMPLETED', 'ARCHIVED']

/** Studies of one owner in one status column, top to bottom (FEATURE-0005). */
export function column(studies: Study[], ownerId: string, status: StudyStatus, exceptId?: string) {
  return studies
    .filter((s) => s.ownerId === ownerId && s.status === status && s.id !== exceptId)
    .sort((a, b) => a.position - b.position)
}

/**
 * Puts `study` at `index` of the `status` column and keeps both the old and the new
 * column dense (0..n-1). ARCHIVED ignores the index: newest archived on top (§4).
 */
export function place(studies: Study[], study: Study, status: StudyStatus, index: number) {
  const previous = study.status
  study.status = status
  if (previous !== status) {
    column(studies, study.ownerId, previous, study.id).forEach((s, i) => (s.position = i))
  }
  const target = column(studies, study.ownerId, status, study.id)
  const at = status === 'ARCHIVED' ? 0 : Math.min(Math.max(0, index), target.length)
  target.splice(at, 0, study)
  target.forEach((s, i) => (s.position = i))
}
