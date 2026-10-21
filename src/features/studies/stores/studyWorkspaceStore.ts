import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError } from '@/shared/http'
import type { Note, Task } from '../domain/workspace'
import { workspaceService } from '../services/workspaceService'

type SectionStatus = 'idle' | 'loading' | 'success' | 'error'

const errorCode = (err: unknown) => (err instanceof ApiError ? err.code : 'INTERNAL_ERROR')

/** Tasks and Notes of the Study open in the detail (FEATURE-0003). */
export const useStudyWorkspaceStore = defineStore('study-workspace', () => {
  const studyId = ref<string | null>(null)
  const tasks = ref<Task[]>([])
  const notes = ref<Note[]>([])
  const tasksStatus = ref<SectionStatus>('idle')
  const notesStatus = ref<SectionStatus>('idle')
  const tasksError = ref<string | null>(null)
  const notesError = ref<string | null>(null)

  /** Tasks with a request in flight; the UI disables their controls. */
  const pendingTaskIds = ref(new Set<string>())

  const doneCount = computed(() => tasks.value.filter((t) => t.done).length)

  async function withPending<T>(taskId: string, action: () => Promise<T>) {
    pendingTaskIds.value = new Set(pendingTaskIds.value).add(taskId)
    try {
      return await action()
    } finally {
      const next = new Set(pendingTaskIds.value)
      next.delete(taskId)
      pendingTaskIds.value = next
    }
  }

  function clear() {
    studyId.value = null
    tasks.value = []
    notes.value = []
    pendingTaskIds.value = new Set()
    tasksStatus.value = 'idle'
    notesStatus.value = 'idle'
    tasksError.value = null
    notesError.value = null
  }

  /** Loads both sections; a failure stays local to its section. */
  async function load(id: string) {
    clear()
    studyId.value = id
    await Promise.all([loadTasks(id), loadNotes(id)])
  }

  async function loadTasks(id: string) {
    tasksStatus.value = 'loading'
    try {
      const res = await workspaceService.listTasks(id)
      if (studyId.value !== id) return
      tasks.value = res.items
      tasksStatus.value = 'success'
    } catch (err) {
      if (studyId.value !== id) return
      tasksError.value = errorCode(err)
      tasksStatus.value = 'error'
    }
  }

  async function loadNotes(id: string) {
    notesStatus.value = 'loading'
    try {
      const res = await workspaceService.listNotes(id)
      if (studyId.value !== id) return
      notes.value = res.items
      notesStatus.value = 'success'
    } catch (err) {
      if (studyId.value !== id) return
      notesError.value = errorCode(err)
      notesStatus.value = 'error'
    }
  }

  function currentStudy() {
    if (!studyId.value) throw new ApiError({ status: 404, code: 'STUDY_NOT_FOUND' })
    return studyId.value
  }

  function replaceTask(task: Task) {
    tasks.value = tasks.value.map((t) => (t.id === task.id ? task : t))
  }

  async function addTask(title: string) {
    const id = currentStudy()
    const task = await workspaceService.createTask(id, title)
    if (studyId.value === id) tasks.value = [...tasks.value, task]
    return task
  }

  async function toggleTask(taskId: string) {
    const id = currentStudy()
    const before = tasks.value.find((t) => t.id === taskId)
    if (!before || pendingTaskIds.value.has(taskId)) return
    const done = !before.done
    replaceTask({ ...before, done })
    await withPending(taskId, async () => {
      try {
        const saved = await workspaceService.updateTask(id, taskId, { done })
        if (studyId.value === id) replaceTask(saved)
      } catch (err) {
        // Roll back only this field, keeping any other change made meanwhile.
        const current = tasks.value.find((t) => t.id === taskId)
        if (studyId.value === id && current) replaceTask({ ...current, done: before.done })
        throw err
      }
    })
  }

  async function renameTask(taskId: string, title: string) {
    const id = currentStudy()
    const saved = await withPending(taskId, () => workspaceService.updateTask(id, taskId, { title }))
    if (studyId.value === id) replaceTask(saved)
  }

  /**
   * Optimistic reorder; the server reindexes the others, so positions are rewritten locally too.
   * On failure the list is reloaded instead of restoring a snapshot that may drop other changes.
   */
  async function moveTask(taskId: string, toIndex: number) {
    const id = currentStudy()
    const from = tasks.value.findIndex((t) => t.id === taskId)
    if (from === -1 || toIndex < 0 || toIndex >= tasks.value.length || toIndex === from) return
    if (pendingTaskIds.value.has(taskId)) return
    const next = [...tasks.value]
    const [moved] = next.splice(from, 1)
    next.splice(toIndex, 0, moved)
    tasks.value = next.map((t, position) => ({ ...t, position }))
    await withPending(taskId, async () => {
      try {
        await workspaceService.updateTask(id, taskId, { position: toIndex })
      } catch (err) {
        if (studyId.value === id) await loadTasks(id)
        throw err
      }
    })
  }

  async function removeTask(taskId: string) {
    const id = currentStudy()
    await withPending(taskId, () => workspaceService.deleteTask(id, taskId))
    if (studyId.value !== id) return
    tasks.value = tasks.value
      .filter((t) => t.id !== taskId)
      .map((t, position) => ({ ...t, position }))
  }

  async function addNote(content: string) {
    const id = currentStudy()
    const note = await workspaceService.createNote(id, content)
    if (studyId.value === id) notes.value = [note, ...notes.value]
    return note
  }

  async function updateNote(noteId: string, content: string) {
    const id = currentStudy()
    const saved = await workspaceService.updateNote(id, noteId, content)
    if (studyId.value === id) notes.value = notes.value.map((n) => (n.id === noteId ? saved : n))
  }

  async function removeNote(noteId: string) {
    const id = currentStudy()
    await workspaceService.deleteNote(id, noteId)
    if (studyId.value === id) notes.value = notes.value.filter((n) => n.id !== noteId)
  }

  return {
    studyId,
    tasks,
    notes,
    pendingTaskIds,
    tasksStatus,
    notesStatus,
    tasksError,
    notesError,
    doneCount,
    clear,
    load,
    addTask,
    toggleTask,
    renameTask,
    moveTask,
    removeTask,
    addNote,
    updateNote,
    removeNote,
  }
})
