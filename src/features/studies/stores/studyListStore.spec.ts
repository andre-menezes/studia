import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/http'
import type { Study, StudyStatus } from '../domain/study'
import { studyService } from '../services/studyService'
import { useStudyListStore } from './studyListStore'

vi.mock('../services/studyService', () => ({
  studyService: { update: vi.fn(), list: vi.fn() },
}))

const update = vi.mocked(studyService.update)
const list = vi.mocked(studyService.list)

function study(id: string, status: StudyStatus, position: number): Study {
  return {
    id,
    title: id,
    objective: 'x',
    routine: { frequency: 'Mon' },
    status,
    createdAt: '',
    position,
  }
}

const column = (status: StudyStatus) =>
  useStudyListStore()
    .data.filter((s) => s.status === status)
    .map((s) => s.id)

describe('studyListStore.moveInBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    update.mockReset()
    list.mockReset()
    useStudyListStore().data = [
      study('a', 'CREATED', 0),
      study('b', 'CREATED', 1),
      study('c', 'CREATED', 2),
      study('s', 'STARTED', 0),
      study('z', 'ARCHIVED', 0),
    ]
  })

  it('reorders inside a column and sends the new index', async () => {
    update.mockResolvedValueOnce(study('c', 'CREATED', 0))
    await useStudyListStore().moveInBoard('c', 'CREATED', 'a')

    expect(column('CREATED')).toEqual(['c', 'a', 'b'])
    expect(update).toHaveBeenCalledWith('c', { position: 0 })
  })

  it('moves to another column with status and position together', async () => {
    update.mockResolvedValueOnce(study('a', 'STARTED', 1))
    await useStudyListStore().moveInBoard('a', 'STARTED', null)

    expect(column('STARTED')).toEqual(['s', 'a'])
    expect(update).toHaveBeenCalledWith('a', { status: 'STARTED', position: 1 })
  })

  it('archives on top without sending a position', async () => {
    update.mockResolvedValueOnce(study('b', 'ARCHIVED', 0))
    await useStudyListStore().moveInBoard('b', 'ARCHIVED', null)

    expect(column('ARCHIVED')).toEqual(['b', 'z'])
    expect(update).toHaveBeenCalledWith('b', { status: 'ARCHIVED' })
  })

  it('applies the move at once and resyncs with the server on error', async () => {
    let reject!: (e: unknown) => void
    update.mockReturnValueOnce(new Promise((_, r) => (reject = r)))
    list.mockResolvedValueOnce({
      items: [study('a', 'CREATED', 0), study('b', 'CREATED', 1), study('s', 'STARTED', 0)],
    })
    const store = useStudyListStore()

    const pending = store.moveInBoard('a', 'STARTED', 's')
    expect(column('STARTED')).toEqual(['a', 's'])

    reject(new ApiError({ status: 403, code: 'STUDY_ACTIVE_LIMIT_REACHED' }))
    await expect(pending).rejects.toBeInstanceOf(ApiError)
    expect(column('CREATED')).toEqual(['a', 'b'])
    expect(column('STARTED')).toEqual(['s'])
  })

  it('restores the previous board when the resync also fails', async () => {
    update.mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR' }))
    list.mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR' }))

    await expect(useStudyListStore().moveInBoard('c', 'CREATED', 'a')).rejects.toBeInstanceOf(ApiError)
    expect(column('CREATED')).toEqual(['a', 'b', 'c'])
  })

  it('keeps the structured routine the server did not echo', async () => {
    const store = useStudyListStore()
    store.data[2] = { ...store.data[2], routine: { frequency: 'Mon', daysOfWeek: ['MON'] } }
    update.mockResolvedValueOnce(study('c', 'CREATED', 0))

    await store.moveInBoard('c', 'CREATED', 'a')
    expect(store.data.find((s) => s.id === 'c')?.routine.daysOfWeek).toEqual(['MON'])
  })

  it('does not call the API when the card ends where it started', async () => {
    await useStudyListStore().moveInBoard('b', 'CREATED', 'c')
    expect(update).not.toHaveBeenCalled()
  })
})

describe('studyListStore.updateStudy', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    update.mockReset()
    useStudyListStore().data = [
      study('a', 'CREATED', 0),
      study('s1', 'STARTED', 0),
      study('s2', 'STARTED', 1),
    ]
  })

  it('puts a card on top of its new column after a status change', async () => {
    update.mockResolvedValueOnce(study('a', 'STARTED', 0))
    await useStudyListStore().updateStudy('a', { status: 'STARTED' })
    expect(column('STARTED')).toEqual(['a', 's1', 's2'])
  })
})
