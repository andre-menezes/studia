import type {
  CoachReply,
  CoachTurnInput,
  GrammarFeedback,
  IdiomTip,
  PracticeMode,
} from '../domain/coach'

type PatternFix = {
  pattern: RegExp
  correction: (match: string, ...groups: string[]) => string
  native: string
}

const FIXES: PatternFix[] = [
  {
    pattern:
      /\bi have\s+(\d+)\s+years?\s+of\s+experience\s+in\s+([a-z0-9.+#]+)\b/i,
    correction: (_m, years, tech) =>
      `I have ${years} years of experience with ${tech}`,
    native: `I've spent {years} years working with {tech} in production.`,
  },
  {
    pattern: /\bi am agree\b/i,
    correction: () => 'I agree',
    native: 'I agree with that approach.',
  },
  {
    pattern: /\bmore better\b/i,
    correction: () => 'better',
    native: 'a stronger option',
  },
  {
    pattern: /\bdepend of\b/i,
    correction: () => 'depend on',
    native: 'it depends on',
  },
  {
    pattern: /\bdiscuss about\b/i,
    correction: () => 'discuss',
    native: "let's discuss",
  },
  {
    pattern: /\bi did a mistake\b/i,
    correction: () => 'I made a mistake',
    native: 'I owned the mistake and fixed the root cause.',
  },
  {
    pattern: /\bthe PR was merged yesterday night\b/i,
    correction: () => 'the PR was merged last night',
    native: 'we merged the PR last night.',
  },
  {
    pattern: /\bi am working here since\b/i,
    correction: () => 'I have been working here since',
    native: "I've been on this team since",
  },
]

const IDIOMS: IdiomTip[] = [
  {
    term: 'ship it',
    meaning: 'Release or merge something that is ready enough to go live.',
    example: "The tests are green and the rollback plan is clear — let's ship it.",
  },
  {
    term: 'raise the bar',
    meaning: 'Increase the quality or performance standard expected from the team.',
    example: 'Code review should raise the bar on observability, not just style.',
  },
  {
    term: 'own the narrative',
    meaning: 'Tell a clear story in interviews: problem → action → impact.',
    example: 'Own the narrative of your outage: detection, mitigation, prevention.',
  },
  {
    term: 'push back',
    meaning: 'Politely disagree or challenge a request with reasoning.',
    example: 'I pushed back on the deadline because we needed a migration plan.',
  },
  {
    term: 'bandwidth',
    meaning: 'Available time/capacity to take on more work.',
    example: "I don't have bandwidth for another design review this sprint.",
  },
  {
    term: 'low-hanging fruit',
    meaning: 'An easy win that delivers value with little effort.',
    example: 'Caching that endpoint was low-hanging fruit for latency.',
  },
]

const OPENERS: Record<PracticeMode, string[]> = {
  behavioral: [
    "Let's run a behavioral interview. Tell me about a time you disagreed with a teammate on a technical decision.",
    'Walk me through a production incident you helped resolve — what you noticed, what you did, and what changed.',
    'Describe a project where you influenced without authority. Keep it crisp.',
  ],
  technical: [
    'Explain how you would design a rate limiter for a public API. Talk trade-offs out loud.',
    'How would you debug a sudden p99 latency spike in a Node service behind a load balancer?',
    'Compare REST and event-driven designs for notifications. When would you pick each?',
  ],
  freeform: [
    "I'm your senior SWE English coach. Pitch yourself in a few sentences for an international SWE role.",
    'Tell me what you shipped last week — speak naturally, and I will tighten the English.',
    'Say anything you would say in a standup or PR review. I will coach delivery.',
  ],
}

const FOLLOW_UPS: Record<PracticeMode, string[]> = {
  behavioral: [
    'Strong start. What was the measurable impact?',
    'Good. Reframe that conflict as collaboration — less blame, more ownership.',
    "If they ask what you'd do differently, answer in one sentence.",
  ],
  technical: [
    'Solid. Name one failure mode and how you would monitor it.',
    'Good instincts. What is the bottleneck and a concrete mitigation?',
    'Clear. Explain that again as if mentoring a mid-level engineer.',
  ],
  freeform: [
    'Got it. Try again with tighter verbs and less filler.',
    'Clear enough. Sound more confident without arrogance.',
    'Nice. Shorten that to a thirty-second intro.',
  ],
}

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length]!
}

function cleanSentence(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function buildFeedback(userText: string): GrammarFeedback | null {
  const original = cleanSentence(userText)
  if (!original) return null

  for (const fix of FIXES) {
    if (fix.pattern.test(original)) {
      const correction = original.replace(fix.pattern, (...args) => {
        const [match, ...rest] = args as unknown as [string, ...string[]]
        return fix.correction(match, ...rest.slice(0, -2))
      })
      let native = fix.native
      const years = original.match(/\b(\d+)\s+years?\b/i)?.[1]
      const tech = original.match(/\bin\s+([a-z0-9.+#]+)\b/i)?.[1]
      if (years) native = native.replace('{years}', years)
      if (tech) native = native.replace('{tech}', tech)
      return {
        original,
        correction: cleanSentence(correction),
        nativeAlternative: native,
      }
    }
  }

  if (/^[a-z]/.test(original) || /\bi\b/.test(original)) {
    const correction = original
      .replace(/\bi\b/g, 'I')
      .replace(/^([a-z])/, (c) => c.toUpperCase())
      .replace(/\s+,/g, ',')
    if (correction !== original) {
      return {
        original,
        correction,
        nativeAlternative: `${correction.replace(/\.$/, '')} — and I'd lead with the outcome.`,
      }
    }
  }

  if (original.length > 12) {
    return {
      original,
      correction: original.replace(/\s+/g, ' ').replace(/\s+\./g, '.'),
      nativeAlternative:
        original.length > 140
          ? 'Lead with the outcome, then one concrete action, then the lesson learned.'
          : `Here's a tighter take: "${original.replace(/\.$/, '')}."`,
    }
  }

  return null
}

function buildIdiom(mode: PracticeMode, seed: number): IdiomTip {
  const pool =
    mode === 'technical'
      ? IDIOMS.filter((i) =>
          ['ship it', 'low-hanging fruit', 'raise the bar'].includes(i.term),
        )
      : mode === 'behavioral'
        ? IDIOMS.filter((i) =>
            [
              'own the narrative',
              'push back',
              'raise the bar',
              'bandwidth',
            ].includes(i.term),
          )
        : IDIOMS
  return pick(pool.length ? pool : IDIOMS, seed)
}

export async function generateMockCoachReply(
  input: CoachTurnInput,
): Promise<CoachReply> {
  const text = cleanSentence(input.userText)
  await new Promise((r) => setTimeout(r, 420 + (hashSeed(text) % 280)))

  const seed = hashSeed(`${input.mode}:${input.turnIndex}:${text}`)
  const feedback = buildFeedback(text)
  const idiom = buildIdiom(input.mode, seed)
  const follow = pick(FOLLOW_UPS[input.mode], seed)
  const spoken = feedback
    ? `${follow} I also tightened your phrasing below.`
    : follow

  return { spoken, feedback, idiom }
}

export function openingMessage(mode: PracticeMode, salt = 0): string {
  return pick(OPENERS[mode], hashSeed(mode) + salt)
}
