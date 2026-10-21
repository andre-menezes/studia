import { beforeEach, describe, expect, it, vi } from 'vitest'

const raw = vi.hoisted(() => vi.fn())

vi.mock('ofetch', () => ({
  ofetch: { create: () => raw },
}))

import { ApiError, configureHttpAuth, http } from './client'

function httpError(status: number, data?: Record<string, unknown>) {
  return Object.assign(new Error(`HTTP ${status}`), { status, data })
}

function authHeader(callIndex: number) {
  const options = raw.mock.calls[callIndex]?.[1] as { headers: Headers }
  return options.headers.get('Authorization')
}

describe('http client', () => {
  let token: string | null
  const onSessionInvalid = vi.fn()

  beforeEach(() => {
    raw.mockReset()
    onSessionInvalid.mockReset()
    token = 'old-token'
    configureHttpAuth({
      getAccessToken: () => token,
      setAccessToken: (next) => {
        token = next
      },
      onSessionInvalid,
    })
  })

  it('sends the access token as a Bearer header', async () => {
    raw.mockResolvedValueOnce({ ok: true })
    await expect(http('/studies')).resolves.toEqual({ ok: true })
    expect(authHeader(0)).toBe('Bearer old-token')
  })

  it('maps RFC 9457 problems to ApiError with the API code', async () => {
    raw.mockRejectedValueOnce(
      httpError(422, { code: 'STUDY_ACTIVE_LIMIT_REACHED', title: 'Limit' }),
    )
    const error = await http('/studies').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, code: 'STUDY_ACTIVE_LIMIT_REACHED' })
  })

  it('falls back to INTERNAL_ERROR when the body has no code', async () => {
    raw.mockRejectedValueOnce(new Error('network down'))
    await expect(http('/studies')).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
    })
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    raw
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce({ accessToken: 'new-token' })
      .mockResolvedValueOnce({ ok: true })

    await expect(http('/studies')).resolves.toEqual({ ok: true })
    expect(raw.mock.calls[1]?.[0]).toBe('/auth/refresh')
    expect(authHeader(2)).toBe('Bearer new-token')
    expect(token).toBe('new-token')
  })

  it('shares a single refresh between concurrent 401s', async () => {
    let resolveRefresh!: (value: { accessToken: string }) => void
    raw.mockImplementation((url: string, options: { headers?: Headers }) => {
      if (url === '/auth/refresh') {
        return new Promise((resolve) => {
          resolveRefresh = resolve
        })
      }
      if (options.headers?.get('Authorization') === 'Bearer new-token') {
        return Promise.resolve({ url })
      }
      return Promise.reject(httpError(401))
    })

    const pending = Promise.all([http('/studies'), http('/auth/me')])
    await vi.waitFor(() => expect(resolveRefresh).toBeTypeOf('function'))
    resolveRefresh({ accessToken: 'new-token' })

    await expect(pending).resolves.toEqual([{ url: '/studies' }, { url: '/auth/me' }])
    const refreshCalls = raw.mock.calls.filter(([url]) => url === '/auth/refresh')
    expect(refreshCalls).toHaveLength(1)
  })

  it('invalidates the session when the refresh fails', async () => {
    raw.mockRejectedValueOnce(httpError(401)).mockRejectedValueOnce(httpError(401))

    await expect(http('/studies')).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_REFRESH_INVALID',
    })
    expect(onSessionInvalid).toHaveBeenCalledTimes(1)
    expect(token).toBeNull()
  })

  it('does not try to refresh a 401 from the login endpoint', async () => {
    raw.mockRejectedValueOnce(httpError(401, { code: 'AUTH_INVALID_CREDENTIALS' }))
    await expect(http('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
    })
    expect(raw).toHaveBeenCalledTimes(1)
  })
})
