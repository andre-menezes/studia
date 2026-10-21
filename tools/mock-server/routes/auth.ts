import { randomUUID } from 'node:crypto'
import { APP_URL, DEV_ENDPOINTS, RESET_TOKEN_TTL_MS } from '../config'
import {
  authenticate,
  db,
  findUserByEmail,
  issueSession,
  mePayload,
  revokeUserResetTokens,
  revokeUserSessions,
  type User,
} from '../db'
import {
  clearRefreshCookie,
  json,
  noContent,
  parseCookies,
  problem,
  readJson,
  setRefreshCookie,
  unauthorized,
  validationFailed,
  type Handler,
} from '../http'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

function sessionResponse(user: User, status = 200) {
  const issued = issueSession(user.id)
  const res = json({ accessToken: issued.accessToken, ...mePayload(user) }, { status })
  res.headers.append('Set-Cookie', setRefreshCookie(issued.refreshToken))
  return res
}

function passwordProblem(password: unknown) {
  if (typeof password !== 'string') return validationFailed()
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return problem(422, 'AUTH_PASSWORD_TOO_WEAK', 'Password does not meet the rules')
  }
  return null
}

function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/** Mock-only: last reset link per email, read by E2E via `/__dev/reset-link`. */
const lastResetLinks = new Map<string, string>()

export const authRoutes: Handler = async (req, path) => {
  if (DEV_ENDPOINTS && req.method === 'GET' && path === '/__dev/reset-link') {
    const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase() ?? ''
    const link = lastResetLinks.get(email)
    return link ? json({ link }) : problem(404, 'NOT_FOUND', 'Not found')
  }

  if (req.method === 'POST' && path === '/auth/login') {
    const body = await readJson<{ email?: string; password?: string }>(req)
    if (!body?.email || !body.password) return validationFailed()
    const user = findUserByEmail(body.email)
    if (!user || user.password !== body.password) {
      return problem(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials')
    }
    return sessionResponse(user)
  }

  if (req.method === 'POST' && path === '/auth/register') {
    const body = await readJson<{
      email?: string
      password?: string
      displayName?: string
      timeZone?: string
    }>(req)
    const email = body?.email?.trim() ?? ''
    const displayName = body?.displayName?.trim() ?? ''
    if (!EMAIL_RE.test(email) || !displayName || displayName.length > 80) {
      return validationFailed()
    }
    const weak = passwordProblem(body?.password)
    if (weak) return weak
    if (findUserByEmail(email)) {
      return problem(409, 'AUTH_EMAIL_TAKEN', 'Email already registered')
    }
    const user: User = {
      id: randomUUID(),
      email,
      displayName,
      password: body!.password!,
      timeZone: isValidTimeZone(body?.timeZone) ? body!.timeZone! : 'UTC',
    }
    db.users.set(user.id, user)
    return sessionResponse(user, 201)
  }

  if (req.method === 'POST' && path === '/auth/password/forgot') {
    const body = await readJson<{ email?: string }>(req)
    if (!body?.email || !EMAIL_RE.test(body.email.trim())) return validationFailed()
    const user = findUserByEmail(body.email)
    if (user) {
      const token = `reset_${randomUUID()}`
      db.resetTokens.set(token, {
        token,
        userId: user.id,
        expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
      })
      // The real backend sends an email; the mock only logs the link.
      const link = `${APP_URL}/reset-password?token=${token}`
      lastResetLinks.set(user.email.toLowerCase(), link)
      console.log(`RESET LINK: ${link}`)
    }
    // Always 202: never reveal whether the account exists.
    return noContent(202)
  }

  if (req.method === 'POST' && path === '/auth/password/reset') {
    const body = await readJson<{ token?: string; password?: string }>(req)
    if (!body?.token) return validationFailed()
    const reset = db.resetTokens.get(body.token)
    if (!reset || Date.now() > reset.expiresAt) {
      return problem(400, 'AUTH_RESET_TOKEN_INVALID', 'Reset token invalid or expired')
    }
    const weak = passwordProblem(body.password)
    if (weak) return weak
    const user = db.users.get(reset.userId)
    if (!user) return problem(400, 'AUTH_RESET_TOKEN_INVALID', 'Reset token invalid or expired')
    user.password = body.password!
    revokeUserResetTokens(user.id)
    revokeUserSessions(user.id)
    return noContent()
  }

  if (req.method === 'POST' && path === '/auth/refresh') {
    const refresh = parseCookies(req).refreshToken
    const session = refresh ? db.sessions.get(refresh) : undefined
    const user = session ? db.users.get(session.userId) : undefined
    if (!refresh || !session || !user) {
      return problem(401, 'AUTH_REFRESH_INVALID', 'Invalid refresh')
    }
    db.sessions.delete(refresh)
    return sessionResponse(user)
  }

  if (req.method === 'POST' && path === '/auth/logout') {
    const refresh = parseCookies(req).refreshToken
    if (refresh) db.sessions.delete(refresh)
    const res = noContent()
    res.headers.append('Set-Cookie', clearRefreshCookie())
    return res
  }

  if (req.method === 'GET' && path === '/auth/me') {
    const user = authenticate(req)
    if (!user) return unauthorized()
    return json(mePayload(user))
  }

  return null
}
