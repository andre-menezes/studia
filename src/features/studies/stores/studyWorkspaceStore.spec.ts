import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/http'
import type { Task } from '../domain/workspace'
import { workspaceService } from '../services/workspaceService'
import { useStudyWorkspaceStore } from './studyWorkspaceStore'

vi.mock('../services/workspaceService', () => ({
  workspaceService: {
    listTasks: vi.fn(),
    listNotes: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}))

const service = vi.mocked(workspaceService)

function task(id: string, position: number, done = false): Task {
  return { id, studyId: 'study-1', title: id, done, position, createdAt: '' }
}

const failure = () => new ApiError({ status: 500, code: 'INTERNAL_ERROR' })

describe('studyWorkspaceStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    service.listTasks.mockResolvedValue({ items: [task('a', 0), task('b', 1), task('c', 2)] })
    service.listNotes.mockResolvedValue({ items: [] })
    await useStudyWorkspaceStore().load('study-1')
  })

  it('keeps a notes failure local to its section', async () => {
    service.listNotes.mockRejectedValueOnce(new ApiError({ status: 404, code: 'STUDY_NOT_FOUND' }))
    const store = useStudyWorkspaceStore()
    await store.load('study-1')

    expect(store.tasksStatus).toBe('success')
    expect(store.notesStatus).toBe('error')
    expect(store.notesError).toBe('STUDY_NOT_FOUND')
  })

  it('appends a new task at the end', async () => {
    service.createTask.mockResolvedValueOnce(task('d', 3))
    const store = useStudyWorkspaceStore()

    await store.addTask('d')

    expect(store.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('toggles a task optimistically and counts it as done', async () => {
    let resolve!: (t: Task) => void
    service.updateTask.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const store = useStudyWorkspaceStore()

    const pending = store.toggleTask('b')
    expect(store.tasks[1].done).toBe(true)
    expect(store.doneCount).toBe(1)

    resolve(task('b', 1, true))
    await pending
    expect(service.updateTask).toHaveBeenCalledWith('study-1', 'b', { done: true })
  })

  it('rolls the toggle back when the server fails', async () => {
    service.updateTask.mockRejectedValueOnce(failure())
    const store = useStudyWorkspaceStore()

    await expect(store.toggleTask('a')).rejects.toBeInstanceOf(ApiError)

    expect(store.tasks[0].done).toBe(false)
    expect(store.doneCount).toBe(0)
  })

  it('moves a task and rewrites positions, reloading from the server on failure', async () => {
    service.updateTask.mockResolvedValueOnce(task('c', 0))
    const store = useStudyWorkspaceStore()

    await store.moveTask('c', 0)
    expect(store.tasks.map((t) => [t.id, t.position])).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ])
    expect(service.updateTask).toHaveBeenCalledWith('study-1', 'c', { position: 0 })

    service.updateTask.mockRejectedValueOnce(failure())
    service.listTasks.mockResolvedValueOnce({ items: [task('c', 0), task('a', 1), task('b', 2)] })
    await expect(store.moveTask('c', 2)).rejects.toBeInstanceOf(ApiError)
    expect(store.tasks.map((t) => t.id)).toEqual(['c', 'a', 'b'])
    expect(store.tasksStatus).toBe('success')
  })

  it('ignores a second toggle while the first is in flight', async () => {
    let resolve!: (t: Task) => void
    service.updateTask.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const store = useStudyWorkspaceStore()

    const first = store.toggleTask('a')
    expect(store.pendingTaskIds.has('a')).toBe(true)
    await store.toggleTask('a')
    expect(store.tasks[0].done).toBe(true)

    resolve(task('a', 0, true))
    await first
    expect(service.updateTask).toHaveBeenCalledTimes(1)
    expect(store.pendingTaskIds.has('a')).toBe(false)
  })

  it('ignores moves past either end', async () => {
    const store = useStudyWorkspaceStore()
    await store.moveTask('a', -1)
    await store.moveTask('c', 3)
    expect(service.updateTask).not.toHaveBeenCalled()
  })

  it('removes a task and closes the gap in positions', async () => {
    service.deleteTask.mockResolvedValueOnce(undefined)
    const store = useStudyWorkspaceStore()

    await store.removeTask('a')

    expect(store.tasks.map((t) => [t.id, t.position])).toEqual([
      ['b', 0],
      ['c', 1],
    ])
  })

  it('drops responses for a study that is no longer open', async () => {
    let resolve!: (t: Task) => void
    service.createTask.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const store = useStudyWorkspaceStore()

    const pending = store.addTask('late')
    store.clear()
    resolve(task('late', 3))
    await pending

    expect(store.tasks).toEqual([])
  })
})
