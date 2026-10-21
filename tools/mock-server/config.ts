export const PORT = Number(process.env.MOCK_PORT ?? 3000)
/** Public URL of this mock, used to build the simulated checkout link. */
export const PUBLIC_URL = process.env.MOCK_PUBLIC_URL ?? `http://localhost:${PORT}`
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

/** FEATURE-0006 (Andre, 2026-10-21): no study limits; statistics later. */
export const PREMIUM_ENTITLEMENTS = {
  capabilities: ['studies.create', 'studies.unlimited'],
  limits: {
    // Fair-use ceilings, not shown to the user (`studies.unlimited`).
    maxActiveStudies: 1000,
    maxStudyCreationsPerMonth: 1000,
  },
}

/** ADR-0012: R$ 50,00/month; Pix buys 30 days. */
export const PREMIUM_PRICE_CENTS = 5000
export const PREMIUM_PERIOD_MS = 30 * 24 * 60 * 60 * 1000
/** An abandoned hosted checkout stops counting as pending after this. */
export const CHECKOUT_TTL_MS = 30 * 60 * 1000
