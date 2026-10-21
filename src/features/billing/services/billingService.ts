import { http } from '@/shared/http'
import type { BillingMethod, Subscription } from '../domain/billing'

export const billingService = {
  getSubscription() {
    return http<Subscription>('/billing/subscription')
  },
  /** Returns the hosted checkout URL (Mercado Pago); the client only redirects. */
  createCheckout(method: BillingMethod) {
    return http<{ checkoutUrl: string }>('/billing/checkout', { method: 'POST', body: { method } })
  },
  cancel() {
    return http<Subscription>('/billing/subscription/cancel', { method: 'POST' })
  },
}
