import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/features/auth'
import { ApiError } from '@/shared/http'
import { hasPremium, type BillingMethod, type Subscription } from '../domain/billing'
import { billingService } from '../services/billingService'

/** State before the redirect; the return page is a fresh load, so it lives in sessionStorage. */
const BASELINE_KEY = 'studia.billing.baseline'

type Baseline = { premium: boolean; currentPeriodEnd?: string }

function saveBaseline(sub: Subscription | null) {
  try {
    const baseline: Baseline = { premium: hasPremium(sub), currentPeriodEnd: sub?.currentPeriodEnd }
    sessionStorage.setItem(BASELINE_KEY, JSON.stringify(baseline))
  } catch {
    // Storage blocked: the return page then only accepts a switch to Premium.
  }
}

function takeBaseline(): Baseline {
  try {
    const raw = sessionStorage.getItem(BASELINE_KEY)
    sessionStorage.removeItem(BASELINE_KEY)
    if (raw) return JSON.parse(raw) as Baseline
  } catch {
    // fall through
  }
  return { premium: false }
}

/** Payment confirmed: Premium appeared, or a renewal pushed the period end forward. */
function confirms(sub: Subscription, baseline: Baseline) {
  if (!hasPremium(sub)) return false
  if (!baseline.premium) return true
  return (
    sub.currentPeriodEnd !== undefined &&
    baseline.currentPeriodEnd !== undefined &&
    Date.parse(sub.currentPeriodEnd) > Date.parse(baseline.currentPeriodEnd)
  )
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

export const useBillingStore = defineStore('billing', () => {
  const subscription = ref<Subscription | null>(null)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref<string | null>(null)

  async function fetchSubscription() {
    status.value = 'loading'
    error.value = null
    try {
      subscription.value = await billingService.getSubscription()
      status.value = 'success'
    } catch (err) {
      status.value = 'error'
      error.value = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
    }
  }

  /** Sends the user to the hosted checkout. Card data never touches the client (ADR-0012). */
  async function startCheckout(
    method: BillingMethod,
    navigate: (url: string) => void = (url) => window.location.assign(url),
  ) {
    const { checkoutUrl } = await billingService.createCheckout(method)
    saveBaseline(subscription.value)
    navigate(checkoutUrl)
  }

  async function cancel() {
    subscription.value = await billingService.cancel()
  }

  /**
   * After the checkout redirect. The return page is no proof of payment (ADR-0012 §4):
   * poll the subscription until it confirms the payment, attempts run out or `signal` aborts.
   */
  async function waitForConfirmation({
    attempts = 10,
    intervalMs = 2000,
    signal,
  }: { attempts?: number; intervalMs?: number; signal?: AbortSignal } = {}) {
    const baseline = takeBaseline()
    for (let i = 0; i < attempts && !signal?.aborted; i++) {
      if (i > 0) await wait(intervalMs, signal)
      if (signal?.aborted) break
      try {
        const sub = await billingService.getSubscription()
        subscription.value = sub
        if (confirms(sub, baseline)) {
          // Entitlements changed with the plan: refresh the session view of them.
          await useAuthStore().refreshUsage()
          return true
        }
      } catch {
        // Keep polling: a transient failure is not a verdict on the payment.
      }
    }
    return false
  }

  return {
    subscription,
    status,
    error,
    fetchSubscription,
    startCheckout,
    cancel,
    waitForConfirmation,
  }
})
