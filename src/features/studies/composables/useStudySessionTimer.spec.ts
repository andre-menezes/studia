import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref, type Ref } from 'vue'
import type { StudyPomodoro, StudyRoutineTime } from '../domain/studyRoutine'
import { useStudySessionTimer } from './useStudySessionTimer'

type Timer = ReturnType<typeof useStudySessionTimer>

function setup(
  time: StudyRoutineTime | null,
  pomodoro: StudyPomodoro | null = null,
) {
  const onCommitStudySeconds = vi.fn()
  const onSignal = vi.fn()
  const preset = ref(time)
  const pomodoroRef: Ref<StudyPomodoro | null> = ref(pomodoro)
  let timer!: Timer
  const wrapper = mount(
    defineComponent({
      setup() {
        timer = useStudySessionTimer(preset, {
          onCommitStudySeconds,
          onSignal,
          pomodoro: pomodoroRef,
        })
        return () => null
      },
    }),
  )
  return { timer, wrapper, onCommitStudySeconds, onSignal }
}

describe('useStudySessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts up when the routine has no duration', () => {
    const { timer } = setup({ hour: 0, minute: 0 })
    expect(timer.hasPreset.value).toBe(false)

    timer.start()
    vi.advanceTimersByTime(65_000)
    expect(timer.phase.value).toBe('studying')
    expect(timer.displayClock.value).toBe('00:01:05')
  })

  it('counts down and stops at zero without Pomodoro (timer does not limit)', () => {
    const { timer, onSignal, onCommitStudySeconds } = setup({ hour: 0, minute: 1 })
    expect(timer.displayClock.value).toBe('00:01:00')

    timer.start()
    vi.advanceTimersByTime(61_000)

    expect(onSignal).toHaveBeenCalledWith('studyComplete')
    expect(timer.phase.value).toBe('paused')
    expect(timer.sessionComplete.value).toBe(true)
    expect(onCommitStudySeconds).toHaveBeenCalledWith(60)
  })

  it('auto-starts the rest after a Pomodoro block, then waits for the next block', () => {
    const { timer, onSignal } = setup(
      { hour: 0, minute: 1 },
      { enabled: true, restMinutes: 1 },
    )
    timer.start()
    vi.advanceTimersByTime(61_000)
    expect(timer.phase.value).toBe('resting')
    expect(timer.displayClock.value).toBe('00:01:00')

    vi.advanceTimersByTime(61_000)
    expect(onSignal).toHaveBeenLastCalledWith('restComplete')
    expect(timer.phase.value).toBe('paused')
    expect(timer.displayClock.value).toBe('00:01:00')
  })

  it('commits only study seconds on pause, never rest seconds', () => {
    const { timer, onCommitStudySeconds } = setup({ hour: 0, minute: 10 })
    timer.start()
    vi.advanceTimersByTime(30_000)
    timer.pause()
    expect(onCommitStudySeconds).toHaveBeenCalledWith(30)

    timer.startRest()
    vi.advanceTimersByTime(60_000)
    timer.skipRest()
    vi.advanceTimersByTime(10_000)
    timer.pause()
    expect(onCommitStudySeconds).toHaveBeenLastCalledWith(10)
    expect(timer.displayClock.value).toBe('00:09:20')
  })

  it('reset returns to the preset and flushes running study time', () => {
    const { timer, onCommitStudySeconds } = setup({ hour: 0, minute: 5 })
    timer.start()
    vi.advanceTimersByTime(20_000)
    timer.reset()
    expect(onCommitStudySeconds).toHaveBeenCalledWith(20)
    expect(timer.phase.value).toBe('idle')
    expect(timer.displayClock.value).toBe('00:05:00')
  })

  it('flushes running study time when the component unmounts', () => {
    const { timer, wrapper, onCommitStudySeconds } = setup({ hour: 0, minute: 0 })
    timer.start()
    vi.advanceTimersByTime(15_000)
    wrapper.unmount()
    expect(onCommitStudySeconds).toHaveBeenCalledWith(15)
  })
})
