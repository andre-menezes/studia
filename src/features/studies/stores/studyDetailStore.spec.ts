import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/http'
import type { Study, StudySession } from '../domain/study'
import { studyService } from '../services/studyService'
import { useStudyDetailStore } from './studyDetailStore'
import { useStudyListStore } from './studyListStore'

vi.mock('../services/studyService', () => ({
  studyService: { createSession: vi.fn() },
}))

const createSession = vi.mocked(studyService.createSession)

const study: Study = {
  id: 'study-1',
  title: 'Vue',
  objective: 'Learn',
  routine: { frequency: 'Mon' },
  status: 'STARTED',
  createdAt: '2026-10-01T00:00:00Z',
  totalStudySeconds: 100,
}

function block(studySeconds: number) {
  return {
    startedAt: '2026-10-21T10:00:00.000Z',
    endedAt: '2026-10-21T10:30:00.000Z',
    studySeconds,
  }
}

function saved(studySeconds: number): StudySession {
  return {
    id: `s-${studySeconds}`,
    clientSessionId: `c-${studySeconds}`,
    studyId: study.id,
    createdAt: '',
    ...block(studySeconds),
  }
}

const offline = () => new ApiError({ status: 500, code: 'INTERNAL_ERROR' })
const rejected = () => new ApiError({ status: 422, code: 'VALIDATION_FAILED' })

describe('studyDetailStore.recordSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    createSession.mockReset()
    const detail = useStudyDetailStore()
    detail.data = { ...study }
    useStudyListStore().upsert({ ...study })
  })

  it('adds the saved seconds to the detail and the list', async () => {
    createSession.mockResolvedValueOnce(saved(60))
    const detail = useStudyDetailStore()

    await expect(detail.recordSession(study.id, block(60))).resolves.toBe(true)

    expect(detail.data?.totalStudySeconds).toBe(160)
    expect(useStudyListStore().data.find((s) => s.id === study.id)?.totalStudySeconds).toBe(160)
  })

  it('keeps a failed block and sends it before the next one', async () => {
    createSession.mockRejectedValueOnce(offline())
    const detail = useStudyDetailStore()

    await expect(detail.recordSession(study.id, block(30))).resolves.toBe(false)
    expect(detail.pendingSessions).toHaveLength(1)
    expect(detail.data?.totalStudySeconds).toBe(100)

    createSession.mockResolvedValueOnce(saved(30)).mockResolvedValueOnce(saved(45))
    await expect(detail.recordSession(study.id, block(45))).resolves.toBe(true)

    expect(createSession.mock.calls.map(([, input]) => input.studySeconds)).toEqual([30, 30, 45])
    expect(detail.pendingSessions).toHaveLength(0)
    expect(detail.data?.totalStudySeconds).toBe(175)
  })

  it('keeps the same clientSessionId when retrying a block', async () => {
    createSession.mockRejectedValueOnce(offline())
    const detail = useStudyDetailStore()
    await detail.recordSession(study.id, block(10))

    createSession.mockResolvedValue(saved(10))
    await detail.recordSession(study.id, block(20))

    const ids = createSession.mock.calls.map(([, input]) => input.clientSessionId)
    expect(ids[0]).toBe(ids[1])
    expect(ids[2]).not.toBe(ids[1])
  })

  it('drops a rejected block and still sends the next ones', async () => {
    createSession.mockRejectedValueOnce(rejected()).mockResolvedValueOnce(saved(20))
    const detail = useStudyDetailStore()

    const first = detail.recordSession(study.id, block(10))
    const second = detail.recordSession(study.id, block(20))

    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(true)
    expect(detail.pendingSessions).toHaveLength(0)
    expect(detail.data?.totalStudySeconds).toBe(120)
  })

  it('never loses blocks when overlapping records both fail', async () => {
    createSession.mockRejectedValue(offline())
    const detail = useStudyDetailStore()

    await Promise.all([
      detail.recordSession(study.id, block(10)),
      detail.recordSession(study.id, block(20)),
    ])

    expect(detail.pendingSessions.map((p) => p.input.studySeconds)).toEqual([10, 20])
  })
})
