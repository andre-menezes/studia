import { computed, reactive, ref } from 'vue'
import type { CreateStudyInput } from '../domain/study'
import {
  DEFAULT_POMODORO_REST_MINUTES,
  DEFAULT_ROUTINE_TIME,
  routineFromSchedule,
  type StudyPomodoro,
  type StudyRoutineTime,
  type WeekDay,
} from '../domain/studyRoutine'

export type WizardStep = 'identity' | 'objective' | 'routine' | 'confirm'

const STEPS: WizardStep[] = ['identity', 'objective', 'routine', 'confirm']

export function useStudyWizard() {
  const currentStep = ref<WizardStep>('identity')
  const draft = reactive({
    title: '',
    objective: '',
    days: [] as WeekDay[],
    time: { ...DEFAULT_ROUTINE_TIME } as StudyRoutineTime,
    notes: '',
    pomodoro: {
      enabled: false,
      restMinutes: DEFAULT_POMODORO_REST_MINUTES,
    } as StudyPomodoro,
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
    draft.days = []
    draft.time = { ...DEFAULT_ROUTINE_TIME }
    draft.notes = ''
    draft.pomodoro = {
      enabled: false,
      restMinutes: DEFAULT_POMODORO_REST_MINUTES,
    }
    currentStep.value = STEPS[0]!
    furthestIndex.value = 0
  }

  function toPayload(dayLabels: Record<WeekDay, string>): CreateStudyInput {
    return {
      title: draft.title.trim(),
      objective: draft.objective.trim(),
      routine: routineFromSchedule(
        draft.days,
        draft.time,
        dayLabels,
        draft.notes,
        draft.pomodoro,
      ),
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
