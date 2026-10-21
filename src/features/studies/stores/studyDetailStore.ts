import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/shared/http'
import type { CreateStudySessionInput, Study, UpdateStudyInput } from '../domain/study'
import { studyService } from '../services/studyService'
import { useStudyListStore } from './studyListStore'

export const useStudyDetailStore = defineStore('study-detail', () => {
  const data = ref<Study | null>(null)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref<string | null>(null)

  function clear() {
    data.value = null
    status.value = 'idle'
    error.value = null
  }

  async function fetchById(studyId: string) {
    status.value = 'loading'
    error.value = null
    try {
      data.value = await studyService.getById(studyId)
      status.value = 'success'
      useStudyListStore().upsert(data.value)
    } catch (err) {
      status.value = 'error'
      error.value = err instanceof Error ? err.message : 'INTERNAL_ERROR'
      data.value = null
      throw err
    }
  }

  async function update(studyId: string, input: UpdateStudyInput) {
    const updated = await useStudyListStore().updateStudy(studyId, input)
    data.value = updated
    return updated
  }

  /** Blocks that failed with a transient error; retried on the next record (ADR-0010 §6). */
  const pendingSessions = ref<{ studyId: string; input: CreateStudySessionInput }[]>([])
  /** Serializes flushes so overlapping records never drop or reorder blocks. */
  let flushing: Promise<boolean> = Promise.resolve(true)

  function recordSession(studyId: string, input: Omit<CreateStudySessionInput, 'clientSessionId'>) {
    pendingSessions.value.push({ studyId, input: { ...input, clientSessionId: crypto.randomUUID() } })
    flushing = flushing.then(flushPending)
    return flushing
  }

  async function flushPending() {
    const queue = pendingSessions.value
    pendingSessions.value = []
    const retry: typeof queue = []
    for (const item of queue) {
      try {
        const session = await studyService.createSession(item.studyId, item.input)
        addStudySeconds(item.studyId, session.studySeconds)
      } catch (err) {
        // A rejected block (422, 404…) would fail forever: drop it and keep going.
        if (isTransient(err)) retry.push(item)
      }
    }
    pendingSessions.value.unshift(...retry)
    return retry.length === 0
  }

  function addStudySeconds(studyId: string, seconds: number) {
    const list = useStudyListStore()
    const current = data.value?.id === studyId ? data.value : list.data.find((s) => s.id === studyId)
    if (!current) return
    const updated = { ...current, totalStudySeconds: (current.totalStudySeconds ?? 0) + seconds }
    if (data.value?.id === studyId) data.value = updated
    list.upsert(updated)
  }

  return { data, status, error, pendingSessions, clear, fetchById, update, recordSession }
})

function isTransient(err: unknown) {
  if (!(err instanceof ApiError)) return true
  return err.status >= 500 || err.status === 408 || err.status === 429
}
