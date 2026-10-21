import { describe, expect, it } from 'vitest'
import type { WeekDay } from '../domain/studyRoutine'
import { useStudyWizard } from './useStudyWizard'

const DAY_LABELS: Record<WeekDay, string> = {
  MON: 'Seg',
  TUE: 'Ter',
  WED: 'Qua',
  THU: 'Qui',
  FRI: 'Sex',
  SAT: 'Sáb',
  SUN: 'Dom',
}

describe('useStudyWizard', () => {
  it('moves forward and back between steps, stopping at the ends', () => {
    const wizard = useStudyWizard()
    expect(wizard.currentStep.value).toBe('identity')
    wizard.back()
    expect(wizard.currentStep.value).toBe('identity')

    wizard.next()
    wizard.next()
    wizard.next()
    expect(wizard.currentStep.value).toBe('confirm')
    expect(wizard.isLast.value).toBe(true)
    wizard.next()
    expect(wizard.currentStep.value).toBe('confirm')

    wizard.back()
    expect(wizard.currentStep.value).toBe('routine')
  })

  it('only jumps to steps already reached', () => {
    const wizard = useStudyWizard()
    wizard.goToStep('confirm')
    expect(wizard.currentStep.value).toBe('identity')

    wizard.next()
    wizard.next()
    wizard.goToStep('identity')
    expect(wizard.currentStep.value).toBe('identity')
    wizard.goToStep('routine')
    expect(wizard.currentStep.value).toBe('routine')
  })

  it('builds a trimmed CREATED payload from the draft', () => {
    const wizard = useStudyWizard()
    wizard.draft.title = '  Inglês  '
    wizard.draft.objective = ' Fluência em 1 ano '
    wizard.draft.days = ['WED', 'MON']
    wizard.draft.time = { hour: 0, minute: 25 }
    wizard.draft.pomodoro = { enabled: true, restMinutes: 5 }

    expect(wizard.toPayload(DAY_LABELS)).toEqual({
      title: 'Inglês',
      objective: 'Fluência em 1 ano',
      routine: {
        frequency: 'Seg, Qua · 25min · Pomodoro 5min',
        daysOfWeek: ['MON', 'WED'],
        time: { hour: 0, minute: 25 },
        pomodoro: { enabled: true, restMinutes: 5 },
        notes: undefined,
      },
      status: 'CREATED',
    })
  })

  it('reset clears the draft and progress', () => {
    const wizard = useStudyWizard()
    wizard.draft.title = 'Inglês'
    wizard.next()
    wizard.next()
    wizard.reset()
    expect(wizard.draft.title).toBe('')
    expect(wizard.currentStep.value).toBe('identity')
    expect(wizard.furthestIndex.value).toBe(0)
  })
})
