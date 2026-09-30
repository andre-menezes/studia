import {
  DEFAULT_OLLAMA_MODEL,
  type PracticeMode,
} from '../domain/coach'

export function getOllamaBaseUrl(): string {
  const configured = import.meta.env.VITE_OLLAMA_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  // Dev default: Vite proxy avoids browser CORS against localhost:11434
  if (import.meta.env.DEV) return '/ollama'
  return 'http://localhost:11434'
}

export function getOllamaModel(): string {
  return (
    import.meta.env.VITE_OLLAMA_MODEL?.trim() ||
    localStorage.getItem('myenglish.ollamaModel')?.trim() ||
    DEFAULT_OLLAMA_MODEL
  )
}

export function setOllamaModelPreference(model: string) {
  localStorage.setItem('myenglish.ollamaModel', model.trim())
}

export function isForcedDemoMode(): boolean {
  if (import.meta.env.VITE_OLLAMA_DEMO_MODE === 'true') return true
  return localStorage.getItem('myenglish.demoMode') === '1'
}

export function setForcedDemoMode(enabled: boolean) {
  localStorage.setItem('myenglish.demoMode', enabled ? '1' : '0')
}

export function pullCommandFor(model: string): string {
  return `ollama pull ${model}`
}

export function buildSystemPrompt(mode: PracticeMode): string {
  const modeLine =
    mode === 'behavioral'
      ? 'Focus on behavioral interview answers (STAR: Situation, Task, Action, Result).'
      : mode === 'technical'
        ? 'Focus on technical interview reasoning: trade-offs, constraints, clarity.'
        : 'Free conversation for standup / PR / networking English.'

  return [
    'You are a Senior Software Engineer and Native English Coach for MyEnglish.',
    'Always reply in English. Never switch to Portuguese or other languages.',
    modeLine,
    'Keep the spoken coaching reply concise (1–3 short sentences) so it works well with text-to-speech in interview practice.',
    'Review the learner utterance for grammar and professional style.',
    'When useful, introduce exactly one technical or corporate English idiom.',
    'Respond with ONLY valid JSON matching this schema (no markdown fences):',
    '{',
    '  "spoken": "string — concise coach reply for speech",',
    '  "feedback": null | { "original": "string", "correction": "string", "nativeAlternative": "string" },',
    '  "idiom": null | { "term": "string", "meaning": "string", "example": "string" }',
    '}',
    'If the utterance is already strong, set feedback to null but still give a short spoken follow-up question.',
    'nativeAlternative must sound like a native engineer in a tech interview or workplace.',
  ].join('\n')
}
