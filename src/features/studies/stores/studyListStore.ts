import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CreateStudyInput, Study, UpdateStudyInput } from '../domain/study'
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
    upsert(updated)
    return updated
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
  }
})
