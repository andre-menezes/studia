import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSessionPayload } from '@/types/auth'
import { authService } from '../services/authService'
import { useAuthStore } from './authStore'

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

function session(overrides: { remaining?: number; maxActive?: number } = {}) {
  const remaining = overrides.remaining ?? 3
  return {
    accessToken: 'token',
    user: { id: 'u1', email: 'user@test.local', displayName: 'Test User' },
    plan: 'FREE',
    entitlements: {
      capabilities: ['study.create'],
      limits: { maxActiveStudies: overrides.maxActive ?? 3 },
    },
    usage: {
      studyCreationsThisPeriod: { used: 10 - remaining, limit: 10, remaining },
    },
  } as AuthSessionPayload
}

describe('authStore entitlements', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('denies everything before a session exists', () => {
    const auth = useAuthStore()
    expect(auth.can('study.create')).toBe(false)
    expect(auth.canCreateStudy()).toBe(false)
    expect(auth.canActivateStudy(0)).toBe(false)
  })

  it('reads capabilities and limits from the session', async () => {
    vi.mocked(authService.login).mockResolvedValue(session())
    const auth = useAuthStore()
    await auth.login('user@test.local', 'password')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.can('study.create')).toBe(true)
    expect(auth.can('stats.view')).toBe(false)
    expect(auth.canCreateStudy()).toBe(true)
    expect(auth.canActivateStudy(2)).toBe(true)
    expect(auth.canActivateStudy(3)).toBe(false)
  })

  it('blocks creation when the monthly quota is used up', async () => {
    vi.mocked(authService.login).mockResolvedValue(session({ remaining: 0 }))
    const auth = useAuthStore()
    await auth.login('user@test.local', 'password')
    expect(auth.canCreateStudy()).toBe(false)
  })

  it('falls back to UNAUTHENTICATED when the bootstrap refresh fails', async () => {
    vi.mocked(authService.refresh).mockRejectedValue(new Error('401'))
    const auth = useAuthStore()
    await auth.initSession()
    expect(auth.status).toBe('UNAUTHENTICATED')
  })

  it('clears the session on logout even if the request fails', async () => {
    vi.mocked(authService.login).mockResolvedValue(session())
    vi.mocked(authService.logout).mockRejectedValue(new Error('network'))
    const auth = useAuthStore()
    await auth.login('user@test.local', 'password')

    await expect(auth.logout()).rejects.toThrow('network')
    expect(auth.status).toBe('UNAUTHENTICATED')
    expect(auth.accessToken).toBeNull()
  })
})
