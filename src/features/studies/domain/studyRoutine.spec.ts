import { describe, expect, it } from 'vitest'
import {
  buildFrequencyLabel,
  canShowSessionTimer,
  clampHour,
  clampMinute,
  clampRestMinutes,
  durationToSeconds,
  formatDurationLabel,
  formatSecondsAsClock,
  isTodayScheduledStudyDay,
  normalizePomodoro,
  parseDurationPart,
  routineFromSchedule,
  scheduleFromRoutine,
  toggleWeekDay,
  type WeekDay,
} from './studyRoutine'

const DAY_LABELS: Record<WeekDay, string> = {
  MON: 'Seg',
  TUE: 'Ter',
  WED: 'Qua',
  THU: 'Qui',
  FRI: 'Sex',
  SAT: 'Sáb',
  SUN: 'Dom',
}

describe('clamping and parsing', () => {
  it('clamps hours, minutes and rest minutes to their ranges', () => {
    expect(clampHour(-1)).toBe(0)
    expect(clampHour(30)).toBe(23)
    expect(clampHour(2.9)).toBe(2)
    expect(clampHour(Number.NaN)).toBe(0)
    expect(clampMinute(75)).toBe(59)
    expect(clampRestMinutes(0)).toBe(1)
    expect(clampRestMinutes(90)).toBe(60)
    expect(clampRestMinutes(Number.NaN)).toBe(5)
  })

  it('parses typed duration parts, treating empty input as 0', () => {
    expect(parseDurationPart('', 'hour')).toBe(0)
    expect(parseDurationPart(' 3 ', 'hour')).toBe(3)
    expect(parseDurationPart('99', 'minute')).toBe(59)
    expect(parseDurationPart('abc', 'minute')).toBe(0)
  })
})

describe('duration formatting', () => {
  it('converts a duration to seconds', () => {
    expect(durationToSeconds({ hour: 1, minute: 30 })).toBe(5400)
  })

  it('builds a human label and omits 00:00', () => {
    expect(formatDurationLabel({ hour: 0, minute: 0 })).toBe('')
    expect(formatDurationLabel({ hour: 0, minute: 25 })).toBe('25min')
    expect(formatDurationLabel({ hour: 2, minute: 0 })).toBe('2h')
    expect(formatDurationLabel({ hour: 1, minute: 30 })).toBe('1h 30min')
  })

  it('formats seconds as HH:MM:SS, never negative', () => {
    expect(formatSecondsAsClock(3725)).toBe('01:02:05')
    expect(formatSecondsAsClock(-10)).toBe('00:00:00')
  })
})

describe('normalizePomodoro', () => {
  it('drops Pomodoro when disabled or without a duration', () => {
    expect(
      normalizePomodoro({ enabled: false, restMinutes: 5 }, { hour: 0, minute: 25 }),
    ).toBeUndefined()
    expect(
      normalizePomodoro({ enabled: true, restMinutes: 5 }, { hour: 0, minute: 0 }),
    ).toBeUndefined()
    expect(normalizePomodoro(null, { hour: 0, minute: 25 })).toBeUndefined()
  })

  it('keeps Pomodoro with a clamped rest when the duration is defined', () => {
    expect(
      normalizePomodoro({ enabled: true, restMinutes: 120 }, { hour: 0, minute: 25 }),
    ).toEqual({ enabled: true, restMinutes: 60 })
  })
})

describe('week days', () => {
  it('toggles a day keeping Monday-first order', () => {
    expect(toggleWeekDay(['FRI', 'MON'], 'WED')).toEqual(['MON', 'WED', 'FRI'])
    expect(toggleWeekDay(['MON', 'WED'], 'MON')).toEqual(['WED'])
  })

  it('treats a routine without days as always scheduled', () => {
    const wednesday = new Date(2026, 9, 21)
    expect(isTodayScheduledStudyDay([], wednesday)).toBe(true)
    expect(isTodayScheduledStudyDay(undefined, wednesday)).toBe(true)
    expect(isTodayScheduledStudyDay(['WED'], wednesday)).toBe(true)
    expect(isTodayScheduledStudyDay(['MON', 'FRI'], wednesday)).toBe(false)
  })
})

describe('routine ↔ schedule', () => {
  it('builds the frequency label with duration and Pomodoro', () => {
    expect(
      buildFrequencyLabel(
        ['WED', 'MON'],
        { hour: 0, minute: 25 },
        DAY_LABELS,
        { enabled: true, restMinutes: 5 },
      ),
    ).toBe('Seg, Qua · 25min · Pomodoro 5min')
    expect(buildFrequencyLabel(['SUN'], { hour: 0, minute: 0 }, DAY_LABELS)).toBe(
      'Dom',
    )
  })

  it('builds a normalized routine payload', () => {
    const routine = routineFromSchedule(
      ['FRI', 'MON'],
      { hour: 1, minute: 99 },
      DAY_LABELS,
      '  ',
      { enabled: true, restMinutes: 10 },
    )
    expect(routine).toEqual({
      frequency: 'Seg, Sex · 1h 59min · Pomodoro 10min',
      daysOfWeek: ['MON', 'FRI'],
      time: { hour: 1, minute: 59 },
      pomodoro: { enabled: true, restMinutes: 10 },
      notes: undefined,
    })
  })

  it('round-trips a routine back into editable schedule fields', () => {
    const routine = routineFromSchedule(
      ['TUE', 'THU'],
      { hour: 0, minute: 45 },
      DAY_LABELS,
      'Revisar vocabulário',
      { enabled: true, restMinutes: 5 },
    )
    expect(scheduleFromRoutine(routine)).toEqual({
      days: ['TUE', 'THU'],
      time: { hour: 0, minute: 45 },
      notes: 'Revisar vocabulário',
      pomodoro: { enabled: true, restMinutes: 5 },
    })
  })

  it('fills defaults for a legacy routine with only a frequency label', () => {
    expect(scheduleFromRoutine({ frequency: '3x por semana' })).toEqual({
      days: [],
      time: { hour: 0, minute: 0 },
      notes: '',
      pomodoro: { enabled: false, restMinutes: 5 },
    })
  })
})

describe('canShowSessionTimer', () => {
  it('shows the timer only for CREATED and STARTED', () => {
    expect(canShowSessionTimer('CREATED')).toBe(true)
    expect(canShowSessionTimer('STARTED')).toBe(true)
    expect(canShowSessionTimer('PAUSED')).toBe(false)
    expect(canShowSessionTimer('ARCHIVED')).toBe(false)
  })
})
