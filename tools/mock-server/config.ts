export const PORT = Number(process.env.MOCK_PORT ?? 3000)
export const ORIGIN = process.env.MOCK_CORS_ORIGIN ?? 'http://localhost:5173'
/** Frontend URL used to print password reset links. */
export const APP_URL = process.env.MOCK_APP_URL ?? ORIGIN

/** Mock-only helpers for E2E (`/__dev/*`); off unless MOCK_DEV_ENDPOINTS=1. */
export const DEV_ENDPOINTS = process.env.MOCK_DEV_ENDPOINTS === '1'

export const ACCESS_TTL_MS = 15 * 60 * 1000
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export const SEED_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'demo@studia.app',
  displayName: 'Demo Studia',
  password: 'studia123',
  timeZone: 'America/Sao_Paulo',
}

export const FREE_ENTITLEMENTS = {
  capabilities: ['studies.create'],
  limits: {
    maxActiveStudies: 3,
    maxStudyCreationsPerMonth: 10,
  },
}
