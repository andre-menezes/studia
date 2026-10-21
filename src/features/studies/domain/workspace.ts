/** Tasks and Notes inside a Study (FEATURE-0003). */
export type Task = {
  id: string
  studyId: string
  title: string
  done: boolean
  /** 0-based order inside the study; the server keeps it dense. */
  position: number
  createdAt: string
  completedAt?: string
}

export type Note = {
  id: string
  studyId: string
  /** Markdown, rendered without raw HTML. */
  content: string
  createdAt: string
  updatedAt: string
}

export type UpdateTaskInput = Partial<Pick<Task, 'title' | 'done' | 'position'>>

export const TASK_TITLE_MAX = 200
export const NOTE_CONTENT_MAX = 10_000
