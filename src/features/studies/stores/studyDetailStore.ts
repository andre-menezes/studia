import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Study, UpdateStudyInput } from '../domain/study'
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

  return { data, status, error, clear, fetchById, update }
})
