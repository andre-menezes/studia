import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  CreateStudyInput,
  Study,
  UpdateStudyInput,
} from '../domain/study'
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
    const created = await studyService.create(input)
    data.value = [created, ...data.value]
    return created
  }

  async function updateStudy(studyId: string, input: UpdateStudyInput) {
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

  return {
    data,
    status,
    error,
    startedCount,
    fetchStudies,
    createStudy,
    updateStudy,
    upsert,
    reorderInBoard,
  }
})
