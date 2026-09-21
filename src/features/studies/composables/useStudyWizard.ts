import { computed, reactive, ref } from 'vue'
import type { CreateStudyInput } from '../domain/study'

export type WizardStep = 'identity' | 'objective' | 'routine' | 'confirm'

const STEPS: WizardStep[] = ['identity', 'objective', 'routine', 'confirm']

export function useStudyWizard() {
  const currentStep = ref<WizardStep>('identity')
  const draft = reactive({
    title: '',
    objective: '',
    frequency: '',
    notes: '',
  })

  const stepIndex = computed(() => STEPS.indexOf(currentStep.value))
  const isFirst = computed(() => stepIndex.value === 0)
  const isLast = computed(() => stepIndex.value === STEPS.length - 1)
  const furthestIndex = ref(0)

  function next() {
    if (!isLast.value) {
      const target = stepIndex.value + 1
      currentStep.value = STEPS[target]!
      if (target > furthestIndex.value) furthestIndex.value = target
    }
  }

  function back() {
    if (!isFirst.value) currentStep.value = STEPS[stepIndex.value - 1]!
  }

  function goToStep(step: WizardStep) {
    const target = STEPS.indexOf(step)
    if (target === -1 || target > furthestIndex.value) return
    currentStep.value = step
  }

  function reset() {
    draft.title = ''
    draft.objective = ''
    draft.frequency = ''
    draft.notes = ''
    currentStep.value = STEPS[0]!
    furthestIndex.value = 0
  }

  function toPayload(): CreateStudyInput {
    return {
      title: draft.title.trim(),
      objective: draft.objective.trim(),
      routine: {
        frequency: draft.frequency.trim(),
        notes: draft.notes.trim() || undefined,
      },
      status: 'CREATED',
    }
  }

  return {
    currentStep,
    draft,
    stepIndex,
    isFirst,
    isLast,
    furthestIndex,
    next,
    back,
    goToStep,
    reset,
    toPayload,
    steps: STEPS,
  }
}
