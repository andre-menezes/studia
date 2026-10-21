import { ofetch } from 'ofetch'
import { ApiError, type ApiProblem } from './errors'

type TokenAccessor = {
  getAccessToken: () => string | null
  setAccessToken: (token: string | null) => void
  onSessionInvalid: () => void
}

let tokenAccessor: TokenAccessor = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  onSessionInvalid: () => undefined,
}

export function configureHttpAuth(accessor: TokenAccessor) {
  tokenAccessor = accessor
}

let refreshPromise: Promise<string | null> | null = null

/** Endpoints whose 401 means bad input, not an expired access token. */
const PUBLIC_AUTH_PATHS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/password/',
]

const raw = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
})

function toApiError(error: unknown): ApiError {
  const err = error as { status?: number; data?: Partial<ApiProblem> }
  return new ApiError({
    type: err.data?.type,
    title: err.data?.title,
    status: err.status ?? 500,
    detail: err.data?.detail,
    code: err.data?.code ?? 'INTERNAL_ERROR',
  })
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = raw<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
      .then((res) => {
        tokenAccessor.setAccessToken(res.accessToken)
        return res.accessToken
      })
      .catch(() => {
        tokenAccessor.setAccessToken(null)
        tokenAccessor.onSessionInvalid()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function http<T>(url: string, options: Parameters<typeof raw<T>>[1] = {}): Promise<T> {
  const headers = new Headers((options?.headers as HeadersInit) ?? undefined)
  const token = tokenAccessor.getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    return await raw<T>(url, { ...options, headers })
  } catch (error) {
    const status = (error as { status?: number }).status
    const isAuthPath = PUBLIC_AUTH_PATHS.some((path) => url.includes(path))
    if (status !== 401 || isAuthPath) throw toApiError(error)

    const newToken = await refreshAccessToken()
    if (!newToken) {
      throw new ApiError({ status: 401, code: 'AUTH_REFRESH_INVALID' })
    }

    headers.set('Authorization', `Bearer ${newToken}`)
    try {
      return await raw<T>(url, { ...options, headers })
    } catch (retryError) {
      throw toApiError(retryError)
    }
  }
}

export { ApiError } from './errors'
