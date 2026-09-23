import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import {
  clampRestMinutes,
  DEFAULT_POMODORO_REST_MINUTES,
  durationToSeconds,
  formatSecondsAsClock,
  isDurationDefined,
  type StudyPomodoro,
  type StudyRoutineTime,
} from '../domain/studyRoutine'

export type SessionTimerPhase = 'idle' | 'studying' | 'paused' | 'resting'

export type SessionTimerSignal = 'studyComplete' | 'restComplete'

type Options = {
  /** Called with newly completed study seconds (never rest). */
  onCommitStudySeconds?: (deltaSeconds: number) => void
  /** Fired when a study or rest block finishes (for UI/sound). */
  onSignal?: (signal: SessionTimerSignal) => void
  pomodoro?: Ref<StudyPomodoro | null | undefined>
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function useStudySessionTimer(
  preset: Ref<StudyRoutineTime | null | undefined>,
  options: Options = {},
) {
  const phase = ref<SessionTimerPhase>('idle')
  const displaySeconds = ref(0)
  const studyElapsed = ref(0)
  const restMinutes = ref(DEFAULT_POMODORO_REST_MINUTES)
  /** Rest duration in seconds captured at `beginRest` (stable for the ring). */
  const restTotalSeconds = ref(0)
  const sessionComplete = ref(false)
  const lastSignal = ref<SessionTimerSignal | null>(null)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let restRemaining = 0
  let lastFlushedElapsed = 0

  const hasPreset = computed(() =>
    preset.value ? isDurationDefined(preset.value) : false,
  )

  const presetSeconds = computed(() =>
    preset.value ? durationToSeconds(preset.value) : 0,
  )

  const pomodoroEnabled = computed(() => {
    const p = options.pomodoro?.value
    return Boolean(p?.enabled && hasPreset.value)
  })

  const displayClock = computed(() =>
    formatSecondsAsClock(displaySeconds.value),
  )

  /**
   * Ring fill: 1 = full, 0 = empty.
   * Count-up / idle without preset → track only (0).
   * Idle with preset → full (1). Rest uses total frozen at beginRest.
   */
  const progressFraction = computed(() => {
    if (phase.value === 'resting') {
      const total = restTotalSeconds.value
      if (total <= 0) return 0
      return clampUnit(displaySeconds.value / total)
    }
    if (!hasPreset.value) return 0
    if (phase.value === 'idle') return 1
    const total = presetSeconds.value
    if (total <= 0) return 0
    return clampUnit(displaySeconds.value / total)
  })

  watch(
    () => options.pomodoro?.value?.restMinutes,
    (minutes) => {
      if (phase.value !== 'idle' && phase.value !== 'paused') return
      if (minutes != null) restMinutes.value = clampRestMinutes(minutes)
    },
    { immediate: true },
  )

  function clearTick() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function flushStudySeconds() {
    const delta = studyElapsed.value - lastFlushedElapsed
    if (delta > 0) {
      lastFlushedElapsed = studyElapsed.value
      options.onCommitStudySeconds?.(delta)
    }
  }

  function emitSignal(signal: SessionTimerSignal) {
    lastSignal.value = signal
    options.onSignal?.(signal)
  }

  function syncIdleDisplay() {
    if (hasPreset.value) {
      displaySeconds.value = presetSeconds.value
    } else {
      displaySeconds.value = 0
    }
  }

  function prepareNextStudyBlock() {
    studyElapsed.value = 0
    lastFlushedElapsed = 0
    sessionComplete.value = false
    if (hasPreset.value) {
      displaySeconds.value = presetSeconds.value
    } else {
      displaySeconds.value = 0
    }
  }

  function beginRest(minutes?: number) {
    const resolved = clampRestMinutes(
      minutes ?? restMinutes.value ?? DEFAULT_POMODORO_REST_MINUTES,
    )
    restMinutes.value = resolved
    restRemaining = resolved * 60
    restTotalSeconds.value = restRemaining
    displaySeconds.value = restRemaining
    sessionComplete.value = false
    phase.value = 'resting'
    startTick()
  }

  function tick() {
    if (phase.value === 'studying') {
      if (hasPreset.value) {
        if (displaySeconds.value <= 0) {
          clearTick()
          flushStudySeconds()
          emitSignal('studyComplete')
          if (pomodoroEnabled.value) {
            beginRest(
              options.pomodoro?.value?.restMinutes ?? restMinutes.value,
            )
          } else {
            phase.value = 'paused'
            sessionComplete.value = true
            displaySeconds.value = 0
          }
          return
        }
        displaySeconds.value -= 1
        studyElapsed.value += 1
      } else {
        displaySeconds.value += 1
        studyElapsed.value += 1
      }
      return
    }

    if (phase.value === 'resting') {
      if (restRemaining <= 0) {
        clearTick()
        emitSignal('restComplete')
        if (pomodoroEnabled.value) {
          prepareNextStudyBlock()
          phase.value = 'paused'
        } else if (hasPreset.value) {
          phase.value = 'paused'
          displaySeconds.value = Math.max(
            0,
            presetSeconds.value - studyElapsed.value,
          )
        } else {
          phase.value = 'paused'
          displaySeconds.value = studyElapsed.value
        }
        return
      }
      restRemaining -= 1
      displaySeconds.value = restRemaining
    }
  }

  function startTick() {
    clearTick()
    intervalId = setInterval(tick, 1000)
  }

  function start() {
    lastSignal.value = null
    sessionComplete.value = false
    if (phase.value === 'idle') {
      studyElapsed.value = 0
      lastFlushedElapsed = 0
      if (hasPreset.value) {
        displaySeconds.value = presetSeconds.value
      } else {
        displaySeconds.value = 0
      }
    } else if (phase.value === 'paused') {
      // After a finished pomodoro rest, elapsed was reset — start a fresh block.
      if (studyElapsed.value === 0 && hasPreset.value) {
        displaySeconds.value = presetSeconds.value
      } else if (hasPreset.value) {
        displaySeconds.value = Math.max(
          0,
          presetSeconds.value - studyElapsed.value,
        )
      } else {
        displaySeconds.value = studyElapsed.value
      }
    }
    phase.value = 'studying'
    startTick()
  }

  function pause() {
    if (phase.value !== 'studying') return
    clearTick()
    phase.value = 'paused'
    flushStudySeconds()
  }

  function resume() {
    if (phase.value !== 'paused') return
    sessionComplete.value = false
    start()
  }

  function reset() {
    if (phase.value === 'studying') {
      flushStudySeconds()
    }
    clearTick()
    phase.value = 'idle'
    studyElapsed.value = 0
    lastFlushedElapsed = 0
    restRemaining = 0
    restTotalSeconds.value = 0
    sessionComplete.value = false
    lastSignal.value = null
    syncIdleDisplay()
  }

  function startRest() {
    if (phase.value !== 'paused' && phase.value !== 'studying') return
    if (phase.value === 'studying') {
      clearTick()
      flushStudySeconds()
    }
    beginRest()
  }

  /**
   * End rest early and immediately resume studying.
   * Pomodoro: prepare the next study block, then start.
   * Manual mid-session rest: restore study countdown/count-up, then start.
   */
  function skipRest() {
    if (phase.value !== 'resting') return
    clearTick()
    lastSignal.value = null
    sessionComplete.value = false
    if (pomodoroEnabled.value) {
      prepareNextStudyBlock()
    } else if (hasPreset.value) {
      displaySeconds.value = Math.max(
        0,
        presetSeconds.value - studyElapsed.value,
      )
    } else {
      displaySeconds.value = studyElapsed.value
    }
    phase.value = 'studying'
    startTick()
  }

  watch(
    preset,
    () => {
      if (phase.value === 'idle') syncIdleDisplay()
    },
    { immediate: true, deep: true },
  )

  onUnmounted(() => {
    if (phase.value === 'studying') {
      flushStudySeconds()
    }
    clearTick()
  })

  return {
    phase,
    displaySeconds,
    displayClock,
    hasPreset,
    presetSeconds,
    progressFraction,
    restTotalSeconds,
    restMinutes,
    sessionComplete,
    lastSignal,
    pomodoroEnabled,
    start,
    pause,
    resume,
    reset,
    startRest,
    skipRest,
  }
}
