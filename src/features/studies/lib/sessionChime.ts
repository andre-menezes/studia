/** Soft session chimes via Web Audio (no asset files). */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

/** Call from a user gesture (e.g. Iniciar timer) so later chimes are allowed. */
export async function unlockSessionAudio(): Promise<void> {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* autoplay policy — ignore */
    }
  }
}

export type SessionChimeKind = 'restStart' | 'restEnd'

/** Two short tones; restEnd is a bit higher/brighter. */
export function playSessionChime(kind: SessionChimeKind = 'restStart'): void {
  const ctx = getCtx()
  if (!ctx) return
  void ctx.resume().catch(() => undefined)

  const now = ctx.currentTime
  const base = kind === 'restEnd' ? 660 : 523.25
  const sequence =
    kind === 'restEnd'
      ? [
          { freq: base, at: 0, dur: 0.18 },
          { freq: base * 1.25, at: 0.2, dur: 0.22 },
        ]
      : [
          { freq: base, at: 0, dur: 0.2 },
          { freq: base * 0.75, at: 0.22, dur: 0.28 },
        ]

  for (const step of sequence) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = step.freq
    gain.gain.setValueAtTime(0.0001, now + step.at)
    gain.gain.exponentialRampToValueAtTime(0.12, now + step.at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + step.at + step.dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + step.at)
    osc.stop(now + step.at + step.dur + 0.02)
  }
}
