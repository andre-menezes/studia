import type {
  CoachEngine,
  CoachReply,
  CoachTurnInput,
  OllamaHealth,
  PracticeMode,
} from '../domain/coach'
import { generateMockCoachReply, openingMessage } from './mockCoachService'
import { checkOllamaHealth } from './ollamaClient'
import { isForcedDemoMode } from './ollamaConfig'
import { generateOllamaCoachReply } from './ollamaCoachService'

export { openingMessage }
export type { CoachTurnInput }

export async function probeCoachEngine(): Promise<{
  engine: CoachEngine
  health: OllamaHealth
}> {
  if (isForcedDemoMode()) {
    return {
      engine: 'mock',
      health: { status: 'unreachable', detail: 'Demo mode enabled' },
    }
  }

  const health = await checkOllamaHealth()
  if (health.status === 'ok') {
    return { engine: 'ollama', health }
  }
  return { engine: 'mock', health }
}

export async function generateCoachReply(
  input: CoachTurnInput,
  preferred: CoachEngine = 'ollama',
): Promise<{ reply: CoachReply; engine: CoachEngine; health: OllamaHealth }> {
  if (preferred === 'mock' || isForcedDemoMode()) {
    const reply = await generateMockCoachReply(input)
    return {
      reply,
      engine: 'mock',
      health: { status: 'unreachable', detail: 'Demo mode' },
    }
  }

  const health = await checkOllamaHealth()
  if (health.status !== 'ok') {
    const reply = await generateMockCoachReply(input)
    return { reply, engine: 'mock', health }
  }

  try {
    const reply = await generateOllamaCoachReply(input)
    return { reply, engine: 'ollama', health }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('MODEL_MISSING:')) {
      const model = message.slice('MODEL_MISSING:'.length)
      const reply = await generateMockCoachReply(input)
      return {
        reply,
        engine: 'mock',
        health: {
          status: 'model_missing',
          model,
          models: health.status === 'ok' ? health.models : [],
          pullCommand: `ollama pull ${model}`,
        },
      }
    }
    const reply = await generateMockCoachReply(input)
    return {
      reply,
      engine: 'mock',
      health: {
        status: 'unreachable',
        detail: message,
      },
    }
  }
}

export function defaultOpener(mode: PracticeMode, salt = 0): string {
  return openingMessage(mode, salt)
}
