import { ORIGIN } from './config'

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function noContent(status = 204) {
  return new Response(null, { status })
}

export function problem(status: number, code: string, title: string) {
  return json(
    { type: 'about:blank', title, status, code },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export const unauthorized = () => problem(401, 'AUTH_UNAUTHORIZED', 'Unauthorized')
export const validationFailed = () => problem(422, 'VALIDATION_FAILED', 'Validation failed')

export function withCors(res: Response) {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', ORIGIN)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  headers.set('Vary', 'Origin')
  return new Response(res.body, { status: res.status, headers })
}

export function parseCookies(req: Request) {
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

export function setRefreshCookie(token: string) {
  return `refreshToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 24 * 60 * 60}`
}

export function clearRefreshCookie() {
  return 'refreshToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

/** Route handler: returns a Response, or null when the route does not match. */
export type Handler = (req: Request, path: string) => Promise<Response | null> | Response | null
