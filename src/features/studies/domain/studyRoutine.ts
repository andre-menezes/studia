import type { StudyRoutine } from './study'

export type WeekDay =
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN'

/** Session duration preset (not clock time of day). */
export type StudyRoutineTime = {
  hour: number
  minute: number
}

/** Optional Pomodoro settings stored with the routine. */
export type StudyPomodoro = {
  enabled: boolean
  /** Rest after each study block (minutes). Default 5. */
  restMinutes: number
}

/** Monday-first order for the routine picker. */
export const WEEK_DAYS: WeekDay[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
]

/** No preset duration (valid). */
export const DEFAULT_ROUTINE_TIME: StudyRoutineTime = {
  hour: 0,
  minute: 0,
}

export const DEFAULT_POMODORO_REST_MINUTES = 5

export function clampHour(value: number): number {
  if (!Number.isFinite(value)) return 0
  const n = Math.trunc(value)
  if (n < 0) return 0
  if (n > 23) return 23
  return n
}

export function clampMinute(value: number): number {
  if (!Number.isFinite(value)) return 0
  const n = Math.trunc(value)
  if (n < 0) return 0
  if (n > 59) return 59
  return n
}

export function clampRestMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POMODORO_REST_MINUTES
  const n = Math.trunc(value)
  if (n < 1) return 1
  if (n > 60) return 60
  return n
}

/** Parse typed input; empty/invalid → 0 then clamp. */
export function parseDurationPart(
  raw: string,
  kind: 'hour' | 'minute',
): number {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const n = Number(trimmed)
  return kind === 'hour' ? clampHour(n) : clampMinute(n)
}

export function isDurationDefined(time: StudyRoutineTime): boolean {
  return clampHour(time.hour) > 0 || clampMinute(time.minute) > 0
}

/** Pomodoro only when enabled and session duration is defined. */
export function normalizePomodoro(
  pomodoro: StudyPomodoro | null | undefined,
  time: StudyRoutineTime,
): StudyPomodoro | undefined {
  if (!pomodoro?.enabled || !isDurationDefined(time)) return undefined
  return {
    enabled: true,
    restMinutes: clampRestMinutes(
      pomodoro.restMinutes ?? DEFAULT_POMODORO_REST_MINUTES,
    ),
  }
}

export function durationToSeconds(time: StudyRoutineTime): number {
  return clampHour(time.hour) * 3600 + clampMinute(time.minute) * 60
}

export function formatClock(time: StudyRoutineTime): string {
  const hour = clampHour(time.hour)
  const minute = clampMinute(time.minute)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** Human-readable duration, e.g. "1h 30min", or empty when 00:00. */
export function formatDurationLabel(time: StudyRoutineTime): string {
  const hour = clampHour(time.hour)
  const minute = clampMinute(time.minute)
  if (hour === 0 && minute === 0) return ''
  if (hour === 0) return `${minute}min`
  if (minute === 0) return `${hour}h`
  return `${hour}h ${minute}min`
}

export function formatSecondsAsClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function toggleWeekDay(days: WeekDay[], day: WeekDay): WeekDay[] {
  if (days.includes(day)) {
    return days.filter((item) => item !== day)
  }
  return WEEK_DAYS.filter((item) => item === day || days.includes(item))
}

export function isRoutineScheduleValid(
  days: WeekDay[],
  time: StudyRoutineTime,
): boolean {
  return (
    days.length > 0 &&
    Number.isFinite(time.hour) &&
    Number.isFinite(time.minute)
  )
}

/**
 * Builds the API `frequency` string from structured schedule.
 * Omits duration when 00:00.
 */
export function buildFrequencyLabel(
  days: WeekDay[],
  time: StudyRoutineTime,
  dayLabels: Record<WeekDay, string>,
  pomodoro?: StudyPomodoro | null,
): string {
  const ordered = WEEK_DAYS.filter((day) => days.includes(day))
  const daysPart = ordered.map((day) => dayLabels[day]).join(', ')
  const duration = formatDurationLabel(time)
  let label = duration ? `${daysPart} · ${duration}` : daysPart
  const normalized = normalizePomodoro(pomodoro, time)
  if (normalized) {
    label = `${label} · Pomodoro ${normalized.restMinutes}min`
  }
  return label
}

export function routineFromSchedule(
  days: WeekDay[],
  time: StudyRoutineTime,
  dayLabels: Record<WeekDay, string>,
  notes?: string,
  pomodoro?: StudyPomodoro | null,
): StudyRoutine {
  const normalizedTime = {
    hour: clampHour(time.hour),
    minute: clampMinute(time.minute),
  }
  const orderedDays = WEEK_DAYS.filter((day) => days.includes(day))
  const normalizedPomodoro = normalizePomodoro(pomodoro, normalizedTime)
  return {
    frequency: buildFrequencyLabel(
      orderedDays,
      normalizedTime,
      dayLabels,
      normalizedPomodoro,
    ),
    daysOfWeek: orderedDays,
    time: normalizedTime,
    pomodoro: normalizedPomodoro,
    notes: notes?.trim() || undefined,
  }
}

export function scheduleFromRoutine(routine: StudyRoutine): {
  days: WeekDay[]
  time: StudyRoutineTime
  notes: string
  pomodoro: StudyPomodoro
} {
  const days = Array.isArray(routine.daysOfWeek)
    ? WEEK_DAYS.filter((day) => routine.daysOfWeek?.includes(day))
    : []
  const time = routine.time
    ? {
        hour: clampHour(routine.time.hour),
        minute: clampMinute(routine.time.minute),
      }
    : { ...DEFAULT_ROUTINE_TIME }
  const pomodoro = normalizePomodoro(routine.pomodoro, time) ?? {
    enabled: false,
    restMinutes: DEFAULT_POMODORO_REST_MINUTES,
  }
  return {
    days,
    time,
    notes: routine.notes ?? '',
    pomodoro,
  }
}

export function canShowSessionTimer(status: string): boolean {
  return status === 'CREATED' || status === 'STARTED'
}

const JS_DAY_TO_WEEKDAY: WeekDay[] = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
]

export function getTodayWeekDay(date: Date = new Date()): WeekDay {
  return JS_DAY_TO_WEEKDAY[date.getDay()] ?? 'MON'
}

/** True when no days configured, or today is among scheduled days. */
export function isTodayScheduledStudyDay(
  days: WeekDay[] | undefined | null,
  date: Date = new Date(),
): boolean {
  if (!days || days.length === 0) return true
  return days.includes(getTodayWeekDay(date))
}
