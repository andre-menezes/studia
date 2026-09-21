import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { configureHttpAuth } from '@/shared/http'
import type { SessionStatus } from '@/types/auth'
import type { Entitlements, Plan, Usage, User } from '@/types/entitlements'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const status = ref<SessionStatus>('UNKNOWN')
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const plan = ref<Plan | null>(null)
  const entitlements = ref<Entitlements | null>(null)
  const usage = ref<Usage | null>(null)

  const isAuthenticated = computed(() => status.value === 'AUTHENTICATED')

  function applySession(payload: {
    accessToken?: string
    user: User
    plan: Plan
    entitlements: Entitlements
    usage: Usage
  }) {
    if (payload.accessToken) accessToken.value = payload.accessToken
    user.value = payload.user
    plan.value = payload.plan
    entitlements.value = payload.entitlements
    usage.value = payload.usage
    status.value = 'AUTHENTICATED'
  }

  function clearSession() {
    accessToken.value = null
    user.value = null
    plan.value = null
    entitlements.value = null
    usage.value = null
    status.value = 'UNAUTHENTICATED'
  }

  configureHttpAuth({
    getAccessToken: () => accessToken.value,
    setAccessToken: (token) => {
      accessToken.value = token
    },
    onSessionInvalid: () => {
      clearSession()
    },
  })

  async function initSession() {
    status.value = 'INITIALIZING'
    try {
      const session = await authService.refresh()
      applySession(session)
    } catch {
      clearSession()
    }
  }

  async function login(email: string, password: string) {
    const session = await authService.login({ email, password })
    applySession(session)
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }

  function can(capability: string) {
    return entitlements.value?.capabilities.includes(capability) ?? false
  }

  function canCreateStudy() {
    const counter = usage.value?.studyCreationsThisPeriod
    if (!counter) return false
    return counter.remaining > 0
  }

  function canActivateStudy(activeCount: number) {
    const max = entitlements.value?.limits?.maxActiveStudies
    if (max == null) return false
    return activeCount < max
  }

  return {
    status,
    accessToken,
    user,
    plan,
    entitlements,
    usage,
    isAuthenticated,
    initSession,
    login,
    logout,
    can,
    canCreateStudy,
    canActivateStudy,
  }
})
