import type { StudyRoutineTime, WeekDay, StudyPomodoro } from './studyRoutine'

export type { WeekDay, StudyRoutineTime, StudyPomodoro } from './studyRoutine'

export type StudyStatus =
  | 'CREATED'
  | 'STARTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED'

export type StudyRoutine = {
  /** Display / API cadence label (derived from days + time when structured). */
  frequency: string
  daysOfWeek?: WeekDay[]
  time?: StudyRoutineTime
  /** Pomodoro: auto rest after each study block (requires positive duration). */
  pomodoro?: StudyPomodoro
  notes?: string
}

export type Study = {
  id: string
  title: string
  objective: string
  routine: StudyRoutine
  status: StudyStatus
  createdAt: string
  /** Accumulated study session seconds (excludes rest). */
  totalStudySeconds?: number
  /** 0-based index inside the board column of its status (FEATURE-0005). */
  position?: number
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
  totalStudySeconds?: number
  /** Desired index in the target column; the server reindexes the others. */
  position?: number
}

/** Board column order on the home screen. */
export const STUDY_STATUS_ORDER: StudyStatus[] = [
  'CREATED',
  'STARTED',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
]
