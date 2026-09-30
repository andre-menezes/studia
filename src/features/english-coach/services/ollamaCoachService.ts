import type {
  CoachReply,
  CoachTurnInput,
  GrammarFeedback,
  IdiomTip,
} from '../domain/coach'
import { chatWithOllama } from './ollamaClient'
import { buildSystemPrompt } from './ollamaConfig'

type RawPayload = {
  spoken?: unknown
  message?: unknown
  feedback?: unknown
  idiom?: unknown
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseFeedback(value: unknown): GrammarFeedback | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const original = asString(obj.original)
  const correction = asString(obj.correction)
  const nativeAlternative = asString(
    obj.nativeAlternative ?? obj.native_alternative ?? obj.native,
  )
  if (!original || !correction || !nativeAlternative) return null
  return { original, correction, nativeAlternative }
}

function parseIdiom(value: unknown): IdiomTip | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const term = asString(obj.term)
  const meaning = asString(obj.meaning)
  const example = asString(obj.example) ?? ''
  if (!term || !meaning) return null
  return { term, meaning, example }
}

function extractJson(raw: string): RawPayload {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as RawPayload
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as RawPayload
    }
    throw new Error('OLLAMA_BAD_JSON')
  }
}

export async function generateOllamaCoachReply(
  input: CoachTurnInput,
): Promise<CoachReply> {
  const history = (input.history ?? []).map((item) => ({
    role: item.role === 'coach' ? ('assistant' as const) : ('user' as const),
    content: item.text,
  }))

  const raw = await chatWithOllama({
    system: buildSystemPrompt(input.mode),
    user: [
      'Learner utterance to coach:',
      `"${input.userText.trim()}"`,
      '',
      'Return JSON only.',
    ].join('\n'),
    history,
  })

  const parsed = extractJson(raw)
  const spoken =
    asString(parsed.spoken) ??
    asString(parsed.message) ??
    'Nice — keep going. Make the next answer a bit tighter.'

  return {
    spoken,
    feedback: parseFeedback(parsed.feedback),
    idiom: parseIdiom(parsed.idiom),
  }
}
