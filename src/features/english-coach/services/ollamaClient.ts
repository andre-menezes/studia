import { ofetch } from 'ofetch'
import type { OllamaHealth } from '../domain/coach'
import {
  getOllamaBaseUrl,
  getOllamaModel,
  pullCommandFor,
} from './ollamaConfig'

type TagsResponse = {
  models?: Array<{ name: string }>
}

type ChatResponse = {
  message?: { content?: string }
  error?: string
}

function client() {
  return ofetch.create({
    baseURL: getOllamaBaseUrl(),
    timeout: 120_000,
  })
}

function modelMatches(installed: string, wanted: string): boolean {
  const a = installed.toLowerCase()
  const b = wanted.toLowerCase()
  return a === b || a.startsWith(`${b}:`) || a.startsWith(`${b}-`)
}

export async function checkOllamaHealth(): Promise<OllamaHealth> {
  const model = getOllamaModel()
  try {
    const tags = await client()<TagsResponse>('/api/tags')
    const models = (tags.models ?? []).map((m) => m.name)
    const hasModel = models.some((name) => modelMatches(name, model))
    if (!hasModel) {
      return {
        status: 'model_missing',
        model,
        models,
        pullCommand: pullCommandFor(model),
      }
    }
    return { status: 'ok', model, models }
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : 'Could not reach Ollama'
    return { status: 'unreachable', detail }
  }
}

export async function chatWithOllama(input: {
  system: string
  user: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<string> {
  const model = getOllamaModel()
  const messages = [
    { role: 'system', content: input.system },
    ...(input.history ?? []),
    { role: 'user', content: input.user },
  ]

  try {
    const res = await client()<ChatResponse>('/api/chat', {
      method: 'POST',
      body: {
        model,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.4,
        },
        messages,
      },
    })
    const content = res.message?.content?.trim()
    if (!content) {
      throw new Error(res.error || 'Empty response from Ollama')
    }
    return content
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/not found|pull/i.test(message)) {
      throw new Error(`MODEL_MISSING:${model}`)
    }
    throw err
  }
}
