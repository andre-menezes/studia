import { http } from '@/shared/http'
import type { AuthSessionPayload, MePayload } from '@/types/auth'

export type LoginBody = {
  email: string
  password: string
}

export type RegisterBody = {
  email: string
  password: string
  displayName: string
  timeZone?: string
}

export type ResetPasswordBody = {
  token: string
  password: string
}

export const authService = {
  login(body: LoginBody) {
    return http<AuthSessionPayload>('/auth/login', { method: 'POST', body })
  },
  register(body: RegisterBody) {
    return http<AuthSessionPayload>('/auth/register', { method: 'POST', body })
  },
  forgotPassword(email: string) {
    return http<void>('/auth/password/forgot', { method: 'POST', body: { email } })
  },
  resetPassword(body: ResetPasswordBody) {
    return http<void>('/auth/password/reset', { method: 'POST', body })
  },
  refresh() {
    return http<AuthSessionPayload>('/auth/refresh', { method: 'POST' })
  },
  logout() {
    return http<void>('/auth/logout', { method: 'POST' })
  },
  me() {
    return http<MePayload>('/auth/me')
  },
}
