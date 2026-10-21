import { http } from '@/shared/http'
import type { Note, Task, UpdateTaskInput } from '../domain/workspace'

const base = (studyId: string) => `/studies/${studyId}`

export const workspaceService = {
  listTasks(studyId: string) {
    return http<{ items: Task[] }>(`${base(studyId)}/tasks`)
  },
  createTask(studyId: string, title: string) {
    return http<Task>(`${base(studyId)}/tasks`, { method: 'POST', body: { title } })
  },
  updateTask(studyId: string, taskId: string, body: UpdateTaskInput) {
    return http<Task>(`${base(studyId)}/tasks/${taskId}`, { method: 'PATCH', body })
  },
  deleteTask(studyId: string, taskId: string) {
    return http<void>(`${base(studyId)}/tasks/${taskId}`, { method: 'DELETE' })
  },
  listNotes(studyId: string) {
    return http<{ items: Note[] }>(`${base(studyId)}/notes`)
  },
  createNote(studyId: string, content: string) {
    return http<Note>(`${base(studyId)}/notes`, { method: 'POST', body: { content } })
  },
  updateNote(studyId: string, noteId: string, content: string) {
    return http<Note>(`${base(studyId)}/notes/${noteId}`, { method: 'PATCH', body: { content } })
  },
  deleteNote(studyId: string, noteId: string) {
    return http<void>(`${base(studyId)}/notes/${noteId}`, { method: 'DELETE' })
  },
}
