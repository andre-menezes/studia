/**
 * Local Mock Server for Studia frontend (OpenAPI MVP).
 * Not a substitute for the future dedicated Mock/Spring repos — local DX only.
 *
 * Seed user: demo@studia.app / studia123
 */
import { ORIGIN, PORT, SEED_USER } from './config'
import { json, problem, withCors, type Handler } from './http'
import { authRoutes } from './routes/auth'
import { billingRoutes } from './routes/billing'
import { studyRoutes } from './routes/studies'

const ENDPOINTS = [
  'POST /auth/login',
  'POST /auth/register',
  'POST /auth/password/forgot',
  'POST /auth/password/reset',
  'POST /auth/refresh',
  'POST /auth/logout',
  'GET /auth/me',
  'GET /__dev/reset-link?email= (MOCK_DEV_ENDPOINTS=1 only)',
  'GET /studies',
  'POST /studies',
  'GET /studies/:id',
  'PATCH /studies/:id',
  'GET|POST /studies/:id/tasks',
  'PATCH|DELETE /studies/:id/tasks/:taskId',
  'GET|POST /studies/:id/notes',
  'PATCH|DELETE /studies/:id/notes/:noteId',
  'GET /studies/:id/sessions?limit=',
  'POST /studies/:id/sessions',
  'GET /billing/subscription',
  'POST /billing/checkout',
  'POST /billing/subscription/cancel',
  'GET|POST /billing/mock-checkout/:id[/approve|/reject] (simulated Mercado Pago)',
]

const routes: Handler[] = [authRoutes, studyRoutes, billingRoutes]

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })

  const url = new URL(req.url)
  if (!url.pathname.startsWith('/api/v1')) return problem(404, 'NOT_FOUND', 'Not found')
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/'

  if (req.method === 'GET' && path === '/') {
    return json({ name: 'studia-mock', version: 'v1', status: 'ok', endpoints: ENDPOINTS })
  }

  for (const route of routes) {
    const res = await route(req, path)
    if (res) return res
  }
  return problem(404, 'NOT_FOUND', 'Not found')
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    return withCors(await handle(req))
  },
})

console.log(`Studia mock listening on http://localhost:${server.port}/api/v1`)
console.log(`Seed user: ${SEED_USER.email} / ${SEED_USER.password}`)
console.log(`CORS origin: ${ORIGIN}`)
