/** Premium subscription as the backend sees it (FEATURE-0006, ADR-0012). */
export type BillingMethod = 'CARD' | 'PIX'

export type SubscriptionStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'CANCELED' | 'EXPIRED'

export type Subscription = {
  plan: 'FREE' | 'PREMIUM'
  status: SubscriptionStatus
  method?: BillingMethod
  priceCents: number
  currency: string
  /** Premium is valid until this instant (next charge for an active card). */
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
}

/** Pix buys 30 days: offer renewal in the last week. */
export const PIX_RENEW_WINDOW_DAYS = 7

export function hasPremium(sub: Subscription | null) {
  return sub?.status === 'ACTIVE' || sub?.status === 'CANCELED'
}

export function canRenewPix(sub: Subscription | null, now = Date.now()) {
  if (!sub || sub.method !== 'PIX' || !hasPremium(sub) || !sub.currentPeriodEnd) return false
  const daysLeft = (Date.parse(sub.currentPeriodEnd) - now) / 86_400_000
  return daysLeft <= PIX_RENEW_WINDOW_DAYS
}
