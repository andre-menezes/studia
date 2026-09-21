export type StudyStatus =
  | 'CREATED'
  | 'STARTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED'

export type StudyRoutine = {
  frequency: string
  notes?: string
}

export type Study = {
  id: string
  title: string
  objective: string
  routine: StudyRoutine
  status: StudyStatus
  createdAt: string
}

export type CreateStudyInput = {
  title: string
  objective: string
  routine: StudyRoutine
  status?: StudyStatus
}

export type UpdateStudyInput = {
  title?: string
  objective?: string
  routine?: StudyRoutine
  status?: StudyStatus
}

/** Board column order on the home screen. */
export const STUDY_STATUS_ORDER: StudyStatus[] = [
  'CREATED',
  'STARTED',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
]
