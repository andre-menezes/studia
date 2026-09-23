/**
 * Local Mock Server for Studia frontend (OpenAPI MVP).
 * Not a substitute for the future dedicated Mock/Spring repos — local DX only.
 *
 * Seed user: demo@studia.app / studia123
 */
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.MOCK_PORT ?? 3000)
const ORIGIN = process.env.MOCK_CORS_ORIGIN ?? 'http://localhost:5173'

type StudyStatus = 'CREATED' | 'STARTED' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

type StudyRoutine = {
  frequency: string
  daysOfWeek?: WeekDay[]
  time?: { hour: number; minute: number }
  pomodoro?: { enabled: boolean; restMinutes: number }
  notes?: string
}

type Study = {
  id: string
  title: string
  objective: string
  routine: StudyRoutine
  status: StudyStatus
  createdAt: string
  totalStudySeconds: number
}

const ACCESS_TTL_MS = 15 * 60 * 1000

type Session = {
  refreshToken: string
  accessToken: string
  accessExpiresAt: number
  userId: string
}

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'demo@studia.app',
  displayName: 'Demo Studia',
  password: 'studia123',
}

const entitlements = {
  capabilities: ['studies.create'],
  limits: {
    maxActiveStudies: 3,
    maxStudyCreationsPerMonth: 10,
  },
}

let studyCreationsUsed = 0
const studies: Study[] = []
const sessions = new Map<string, Session>()

function normalizeRoutine(input: {
  frequency?: string
  daysOfWeek?: WeekDay[]
  time?: { hour?: number; minute?: number }
  pomodoro?: { enabled?: boolean; restMinutes?: number }
  notes?: string
} | undefined): StudyRoutine | null {
  if (!input?.frequency?.trim()) return null
  const routine: StudyRoutine = {
    frequency: input.frequency.trim(),
    notes: input.notes?.trim() || undefined,
  }
  if (Array.isArray(input.daysOfWeek) && input.daysOfWeek.length > 0) {
    routine.daysOfWeek = input.daysOfWeek
  }
  if (input.time != null) {
    const hour = Number(input.time.hour)
    const minute = Number(input.time.minute)
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      routine.time = {
        hour: ((Math.trunc(hour) % 24) + 24) % 24,
        minute: ((Math.trunc(minute) % 60) + 60) % 60,
      }
    }
  }
  if (input.pomodoro?.enabled && routine.time) {
    const hasDuration =
      (routine.time.hour ?? 0) > 0 || (routine.time.minute ?? 0) > 0
    if (hasDuration) {
      const rest = Number(input.pomodoro.restMinutes ?? 5)
      routine.pomodoro = {
        enabled: true,
        restMinutes: Math.min(
          60,
          Math.max(1, Number.isFinite(rest) ? Math.trunc(rest) : 5),
        ),
      }
    }
  }
  return routine
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { ...init, headers })
}

function problem(status: number, code: string, title: string) {
  return json(
    {
      type: 'about:blank',
      title,
      status,
      code,
    },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    },
  )
}

function corsHeaders(req: Request) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', ORIGIN)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  headers.set('Vary', 'Origin')
  return headers
}

function withCors(req: Request, res: Response) {
  const headers = new Headers(res.headers)
  for (const [k, v] of corsHeaders(req)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}

function parseCookies(req: Request) {
  const raw = req.headers.get('Cookie') ?? ''
  return Object.fromEntries(
    raw
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=')
        return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]
      }),
  ) as Record<string, string>
}

function setRefreshCookie(token: string) {
  return `refreshToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 24 * 60 * 60}`
}

function clearRefreshCookie() {
  return 'refreshToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

function usage() {
  const limit = entitlements.limits.maxStudyCreationsPerMonth
  return {
    studyCreationsThisPeriod: {
      used: studyCreationsUsed,
      limit,
      remaining: Math.max(0, limit - studyCreationsUsed),
    },
  }
}

function sessionPayload(accessToken: string) {
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    plan: 'FREE' as const,
    entitlements,
    usage: usage(),
  }
}

function issueSession() {
  const accessToken = `access_${randomUUID()}`
  const refreshToken = `refresh_${randomUUID()}`
  sessions.set(refreshToken, {
    refreshToken,
    accessToken,
    accessExpiresAt: Date.now() + ACCESS_TTL_MS,
    userId: user.id,
  })
  return { accessToken, refreshToken }
}

function bearerUserId(req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  for (const session of sessions.values()) {
    if (session.accessToken !== token) continue
    if (Date.now() > session.accessExpiresAt) return null
    return session.userId
  }
  return null
}

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') {
      return withCors(req, new Response(null, { status: 204 }))
    }

    if (!url.pathname.startsWith('/api/v1')) {
      return withCors(req, problem(404, 'NOT_FOUND', 'Not found'))
    }

    const path = url.pathname.replace(/^\/api\/v1/, '') || '/'

    if (req.method === 'GET' && path === '/') {
      return withCors(
        req,
        json({
          name: 'studia-mock',
          version: 'v1',
          status: 'ok',
          endpoints: [
            'POST /auth/login',
            'POST /auth/refresh',
            'POST /auth/logout',
            'GET /auth/me',
            'GET /studies',
            'POST /studies',
            'GET /studies/:id',
            'PATCH /studies/:id',
          ],
        }),
      )
    }

    if (req.method === 'POST' && path === '/auth/login') {
      const body = await readJson<{ email?: string; password?: string }>(req)
      if (!body?.email || !body.password) {
        return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
      }
      if (body.email !== user.email || body.password !== user.password) {
        return withCors(req, problem(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials'))
      }
      const issued = issueSession()
      const res = json(sessionPayload(issued.accessToken), { status: 200 })
      res.headers.append('Set-Cookie', setRefreshCookie(issued.refreshToken))
      return withCors(req, res)
    }

    if (req.method === 'POST' && path === '/auth/refresh') {
      const cookies = parseCookies(req)
      const refresh = cookies.refreshToken
      if (!refresh || !sessions.has(refresh)) {
        return withCors(req, problem(401, 'AUTH_REFRESH_INVALID', 'Invalid refresh'))
      }
      sessions.delete(refresh)
      const issued = issueSession()
      const res = json(sessionPayload(issued.accessToken), { status: 200 })
      res.headers.append('Set-Cookie', setRefreshCookie(issued.refreshToken))
      return withCors(req, res)
    }

    if (req.method === 'POST' && path === '/auth/logout') {
      const cookies = parseCookies(req)
      if (cookies.refreshToken) sessions.delete(cookies.refreshToken)
      const res = new Response(null, { status: 204 })
      res.headers.append('Set-Cookie', clearRefreshCookie())
      return withCors(req, res)
    }

    if (req.method === 'GET' && path === '/auth/me') {
      if (!bearerUserId(req)) {
        return withCors(req, problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'))
      }
      return withCors(
        req,
        json({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
          plan: 'FREE',
          entitlements,
          usage: usage(),
        }),
      )
    }

    if (req.method === 'GET' && path === '/studies') {
      if (!bearerUserId(req)) {
        return withCors(req, problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'))
      }
      return withCors(req, json({ items: studies }))
    }

    if (req.method === 'POST' && path === '/studies') {
      if (!bearerUserId(req)) {
        return withCors(req, problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'))
      }
      const body = await readJson<{
        title?: string
        objective?: string
        routine?: {
          frequency?: string
          daysOfWeek?: WeekDay[]
          time?: { hour?: number; minute?: number }
          pomodoro?: { enabled?: boolean; restMinutes?: number }
          notes?: string
        }
        status?: StudyStatus
      }>(req)
      const routine = normalizeRoutine(body?.routine)
      if (!body?.title?.trim() || !body.objective?.trim() || !routine) {
        return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
      }
      if (usage().studyCreationsThisPeriod.remaining <= 0) {
        return withCors(req, problem(403, 'STUDY_CREATE_LIMIT_REACHED', 'Create limit reached'))
      }
      const startedCount = studies.filter((s) => s.status === 'STARTED').length
      const nextStatus = body.status ?? 'CREATED'
      if (nextStatus === 'STARTED' && startedCount >= entitlements.limits.maxActiveStudies) {
        return withCors(req, problem(403, 'STUDY_ACTIVE_LIMIT_REACHED', 'Active limit reached'))
      }
      const study: Study = {
        id: randomUUID(),
        title: body.title.trim(),
        objective: body.objective.trim(),
        routine,
        status: nextStatus,
        createdAt: new Date().toISOString(),
        totalStudySeconds: 0,
      }
      studies.unshift(study)
      studyCreationsUsed += 1
      return withCors(req, json(study, { status: 201 }))
    }

    const studyMatch = path.match(/^\/studies\/([^/]+)$/)
    if (req.method === 'GET' && studyMatch) {
      if (!bearerUserId(req)) {
        return withCors(req, problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'))
      }
      const study = studies.find((s) => s.id === studyMatch[1])
      if (!study) return withCors(req, problem(404, 'STUDY_NOT_FOUND', 'Not found'))
      return withCors(req, json(study))
    }

    if (req.method === 'PATCH' && studyMatch) {
      if (!bearerUserId(req)) {
        return withCors(req, problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'))
      }
      const study = studies.find((s) => s.id === studyMatch[1])
      if (!study) return withCors(req, problem(404, 'STUDY_NOT_FOUND', 'Not found'))

      const body = await readJson<{
        title?: string
        objective?: string
        routine?: {
          frequency?: string
          daysOfWeek?: WeekDay[]
          time?: { hour?: number; minute?: number }
          pomodoro?: { enabled?: boolean; restMinutes?: number }
          notes?: string
        }
        status?: StudyStatus
        totalStudySeconds?: number
      }>(req)

      const hasTitle = body?.title !== undefined
      const hasObjective = body?.objective !== undefined
      const hasRoutine = body?.routine !== undefined
      const hasStatus = body?.status !== undefined
      const hasTotalStudy =
        body?.totalStudySeconds !== undefined && body.totalStudySeconds !== null
      if (
        !hasTitle &&
        !hasObjective &&
        !hasRoutine &&
        !hasStatus &&
        !hasTotalStudy
      ) {
        return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
      }

      if (hasTitle) {
        if (!body!.title?.trim()) {
          return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
        }
        study.title = body!.title.trim()
      }
      if (hasObjective) {
        if (!body!.objective?.trim()) {
          return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
        }
        study.objective = body!.objective.trim()
      }
      if (hasRoutine) {
        const routine = normalizeRoutine(body!.routine)
        if (!routine) {
          return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
        }
        study.routine = routine
      }
      if (hasStatus) {
        const nextStatus = body!.status!
        const starting = nextStatus === 'STARTED' && study.status !== 'STARTED'
        if (starting) {
          const startedCount = studies.filter((s) => s.status === 'STARTED').length
          if (startedCount >= entitlements.limits.maxActiveStudies) {
            return withCors(
              req,
              problem(403, 'STUDY_ACTIVE_LIMIT_REACHED', 'Active limit reached'),
            )
          }
        }
        study.status = nextStatus
      }
      if (hasTotalStudy) {
        const value = Number(body!.totalStudySeconds)
        if (!Number.isFinite(value) || value < 0) {
          return withCors(req, problem(422, 'VALIDATION_FAILED', 'Validation failed'))
        }
        study.totalStudySeconds = Math.trunc(value)
      }

      return withCors(req, json(study))
    }

    return withCors(req, problem(404, 'NOT_FOUND', 'Not found'))
  },
})

console.log(`Studia mock listening on http://localhost:${server.port}/api/v1`)
console.log(`Seed user: ${user.email} / ${user.password}`)
console.log(`CORS origin: ${ORIGIN}`)
