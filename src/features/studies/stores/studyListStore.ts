import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  CreateStudyInput,
  Study,
  StudyStatus,
  UpdateStudyInput,
} from '../domain/study'
import { useAuthStore } from '@/features/auth'
import { ApiError } from '@/shared/http'
import { studyService } from '../services/studyService'

export const useStudyListStore = defineStore('study-list', () => {
  const data = ref<Study[]>([])
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref<string | null>(null)

  const startedCount = computed(
    () => data.value.filter((s) => s.status === 'STARTED').length,
  )

  function upsert(study: Study) {
    const index = data.value.findIndex((s) => s.id === study.id)
    if (index === -1) {
      data.value = [study, ...data.value]
      return
    }
    const next = [...data.value]
    next[index] = study
    data.value = next
  }

  async function fetchStudies() {
    status.value = 'loading'
    error.value = null
    try {
      const res = await studyService.list()
      data.value = res.items
      status.value = 'success'
    } catch (err) {
      status.value = 'error'
      error.value = err instanceof Error ? err.message : 'INTERNAL_ERROR'
      throw err
    }
  }

  async function createStudy(input: CreateStudyInput) {
    let created: Study
    try {
      created = await studyService.create(input)
    } catch (error) {
      // Usage shown by the client was stale: resync it with the server.
      if (error instanceof ApiError && error.code === 'STUDY_CREATE_LIMIT_REACHED') {
        void useAuthStore().refreshUsage()
      }
      throw error
    }
    data.value = [created, ...data.value]
    void useAuthStore().refreshUsage()
    return created
  }

  async function updateStudy(studyId: string, input: UpdateStudyInput) {
    const previousStatus = data.value.find((s) => s.id === studyId)?.status
    const updated = await studyService.update(studyId, input)
    // Keep structured routine fields if the API echoes only the frequency label.
    if (input.routine) {
      updated.routine = {
        ...updated.routine,
        daysOfWeek: updated.routine.daysOfWeek ?? input.routine.daysOfWeek,
        time: updated.routine.time ?? input.routine.time,
        pomodoro: updated.routine.pomodoro ?? input.routine.pomodoro,
        notes: updated.routine.notes ?? input.routine.notes,
        frequency: updated.routine.frequency || input.routine.frequency,
      }
    }
    upsert(updated)
    // The server puts a status change without position on top of the new column (FEATURE-0005 §2).
    if (previousStatus && updated.status !== previousStatus && input.position === undefined) {
      const top = data.value.find((s) => s.status === updated.status && s.id !== studyId)
      reorderInBoard(studyId, top?.id ?? null)
    }
    return updated
  }

  /**
   * Places a study before `beforeStudyId` within the board list
   * (or at the end of its current status group when `beforeStudyId` is null).
   * Does not call the API and does not change status — persist status first when needed.
   */
  function reorderInBoard(studyId: string, beforeStudyId: string | null) {
    const list = [...data.value]
    const fromIndex = list.findIndex((s) => s.id === studyId)
    if (fromIndex === -1) return

    const [removed] = list.splice(fromIndex, 1)
    if (!removed) return
    const status = removed.status

    let insertAt = list.length
    if (beforeStudyId) {
      const targetIndex = list.findIndex((s) => s.id === beforeStudyId)
      if (targetIndex !== -1) {
        insertAt = targetIndex
      }
    } else {
      let lastOfStatus = -1
      for (let i = 0; i < list.length; i++) {
        if (list[i]?.status === status) lastOfStatus = i
      }
      insertAt = lastOfStatus === -1 ? list.length : lastOfStatus + 1
    }

    list.splice(insertAt, 0, removed)
    data.value = list
  }

  /**
   * Moves a card on the board (status and/or order) and persists it (FEATURE-0005).
   * Optimistic: the board changes at once and goes back to the previous order on error.
   */
  async function moveInBoard(
    studyId: string,
    toStatus: StudyStatus,
    beforeStudyId: string | null,
  ) {
    const before = data.value
    const current = before.find((s) => s.id === studyId)
    if (!current) return

    // ARCHIVED keeps newest on top and is never reordered (FEATURE-0005 §4).
    const archiving = toStatus === 'ARCHIVED'
    const anchor = archiving
      ? (before.find((s) => s.status === 'ARCHIVED' && s.id !== studyId)?.id ?? null)
      : beforeStudyId

    const fromIndex = before.filter((s) => s.status === current.status).findIndex((s) => s.id === studyId)
    data.value = before.map((s) => (s.id === studyId ? { ...s, status: toStatus } : s))
    reorderInBoard(studyId, anchor)

    const input: UpdateStudyInput = {}
    if (toStatus !== current.status) input.status = toStatus
    if (!archiving) {
      const toIndex = data.value
        .filter((s) => s.status === toStatus)
        .findIndex((s) => s.id === studyId)
      if (input.status || toIndex !== fromIndex) input.position = toIndex
    }
    if (input.status === undefined && input.position === undefined) {
      data.value = before
      return
    }

    try {
      const updated = await studyService.update(studyId, input)
      // A move never changes the routine: keep the structured fields we already have.
      data.value = data.value.map((s) =>
        s.id === studyId ? { ...updated, routine: s.routine } : s,
      )
    } catch (err) {
      // Other moves may have landed meanwhile: resync with the server instead of a stale snapshot.
      await fetchStudies().catch(() => {
        data.value = before
      })
      throw err
    }
  }

  return {
    data,
    status,
    error,
    startedCount,
    fetchStudies,
    createStudy,
    updateStudy,
    upsert,
    moveInBoard,
  }
})
