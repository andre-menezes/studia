import { randomUUID } from 'node:crypto'
import { ACCESS_TTL_MS, FREE_ENTITLEMENTS, SEED_USER } from './config'

export type StudyStatus = 'CREATED' | 'STARTED' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type StudyRoutine = {
  frequency: string
  daysOfWeek?: WeekDay[]
  time?: { hour: number; minute: number }
  pomodoro?: { enabled: boolean; restMinutes: number }
  notes?: string
}

export type Study = {
  id: string
  ownerId: string
  title: string
  objective: string
  routine: StudyRoutine
  status: StudyStatus
  createdAt: string
  totalStudySeconds: number
}

export type User = {
  id: string
  email: string
  displayName: string
  password: string
  timeZone: string
}

type Session = {
  refreshToken: string
  accessToken: string
  accessExpiresAt: number
  userId: string
}

type ResetToken = {
  token: string
  userId: string
  expiresAt: number
}

/** In-memory state: resets on every restart (DX only). */
export const db = {
  users: new Map<string, User>([[SEED_USER.id, { ...SEED_USER }]]),
  sessions: new Map<string, Session>(),
  resetTokens: new Map<string, ResetToken>(),
  studies: [] as Study[],
  studyCreationsUsed: new Map<string, number>(),
}

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalized) return user
  }
  return null
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email, displayName: user.displayName }
}

export function usage(userId: string) {
  const limit = FREE_ENTITLEMENTS.limits.maxStudyCreationsPerMonth
  const used = db.studyCreationsUsed.get(userId) ?? 0
  return {
    studyCreationsThisPeriod: {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    },
  }
}

export function mePayload(user: User) {
  return {
    user: publicUser(user),
    plan: 'FREE' as const,
    entitlements: FREE_ENTITLEMENTS,
    usage: usage(user.id),
  }
}

export function issueSession(userId: string) {
  const accessToken = `access_${randomUUID()}`
  const refreshToken = `refresh_${randomUUID()}`
  db.sessions.set(refreshToken, {
    refreshToken,
    accessToken,
    accessExpiresAt: Date.now() + ACCESS_TTL_MS,
    userId,
  })
  return { accessToken, refreshToken }
}

export function revokeUserSessions(userId: string) {
  for (const [token, session] of db.sessions) {
    if (session.userId === userId) db.sessions.delete(token)
  }
}

export function revokeUserResetTokens(userId: string) {
  for (const [token, reset] of db.resetTokens) {
    if (reset.userId === userId) db.resetTokens.delete(token)
  }
}

/** User for a valid, non-expired bearer token, or null. */
export function authenticate(req: Request): User | null {
  const header = req.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  for (const session of db.sessions.values()) {
    if (session.accessToken !== token) continue
    if (Date.now() > session.accessExpiresAt) return null
    return db.users.get(session.userId) ?? null
  }
  return null
}
