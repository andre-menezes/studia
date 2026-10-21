import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth'
import type { Subscription } from '../domain/billing'
import { canRenewPix } from '../domain/billing'
import { billingService } from '../services/billingService'
import { useBillingStore } from './billingStore'

vi.mock('../services/billingService', () => ({
  billingService: { getSubscription: vi.fn(), createCheckout: vi.fn(), cancel: vi.fn() },
}))

const service = vi.mocked(billingService)

function sub(partial: Partial<Subscription> = {}): Subscription {
  return {
    plan: 'FREE',
    status: 'NONE',
    priceCents: 5000,
    currency: 'BRL',
    cancelAtPeriodEnd: false,
    ...partial,
  }
}

describe('billingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    sessionStorage.clear()
  })

  it('redirects to the hosted checkout URL', async () => {
    service.createCheckout.mockResolvedValueOnce({ checkoutUrl: 'https://mp.example/x' })
    const navigate = vi.fn()

    await useBillingStore().startCheckout('CARD', navigate)

    expect(service.createCheckout).toHaveBeenCalledWith('CARD')
    expect(navigate).toHaveBeenCalledWith('https://mp.example/x')
  })

  it('keeps the canceled subscription returned by the server', async () => {
    service.cancel.mockResolvedValueOnce(sub({ plan: 'PREMIUM', status: 'CANCELED' }))
    const store = useBillingStore()

    await store.cancel()

    expect(store.subscription?.status).toBe('CANCELED')
  })

  it('confirms once the subscription turns Premium and refreshes entitlements', async () => {
    const refresh = vi.spyOn(useAuthStore(), 'refreshUsage').mockResolvedValue(undefined)
    service.getSubscription
      .mockResolvedValueOnce(sub())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(sub({ plan: 'PREMIUM', status: 'ACTIVE', method: 'CARD' }))

    await expect(
      useBillingStore().waitForConfirmation({ attempts: 5, intervalMs: 0 }),
    ).resolves.toBe(true)
    expect(service.getSubscription).toHaveBeenCalledTimes(3)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('gives up after the last attempt while the payment is pending', async () => {
    service.getSubscription.mockResolvedValue(sub())

    await expect(
      useBillingStore().waitForConfirmation({ attempts: 2, intervalMs: 0 }),
    ).resolves.toBe(false)
    expect(service.getSubscription).toHaveBeenCalledTimes(2)
  })

  it('does not confirm a Pix renewal until the period end moves forward', async () => {
    vi.spyOn(useAuthStore(), 'refreshUsage').mockResolvedValue(undefined)
    const before = sub({ plan: 'PREMIUM', status: 'ACTIVE', method: 'PIX', currentPeriodEnd: '2026-10-25T00:00:00Z' })
    service.getSubscription.mockResolvedValueOnce(before)
    service.createCheckout.mockResolvedValueOnce({ checkoutUrl: 'https://mp.example/x' })
    const store = useBillingStore()
    await store.fetchSubscription()
    await store.startCheckout('PIX', vi.fn())

    service.getSubscription
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce({ ...before, currentPeriodEnd: '2026-11-24T00:00:00Z' })

    await expect(store.waitForConfirmation({ attempts: 1, intervalMs: 0 })).resolves.toBe(false)
  })

  it('stops polling when aborted', async () => {
    service.getSubscription.mockResolvedValue(sub())
    const controller = new AbortController()
    controller.abort()

    await expect(
      useBillingStore().waitForConfirmation({ attempts: 5, intervalMs: 0, signal: controller.signal }),
    ).resolves.toBe(false)
    expect(service.getSubscription).not.toHaveBeenCalled()
  })
})

describe('canRenewPix', () => {
  const now = Date.parse('2026-10-21T00:00:00Z')
  const pix = (end: string) => sub({ plan: 'PREMIUM', status: 'ACTIVE', method: 'PIX', currentPeriodEnd: end })

  it('offers renewal only in the last 7 days of a Pix period', () => {
    expect(canRenewPix(pix('2026-10-25T00:00:00Z'), now)).toBe(true)
    expect(canRenewPix(pix('2026-11-15T00:00:00Z'), now)).toBe(false)
  })

  it('never offers Pix renewal to a card subscription', () => {
    expect(
      canRenewPix(sub({ status: 'ACTIVE', method: 'CARD', currentPeriodEnd: '2026-10-22T00:00:00Z' }), now),
    ).toBe(false)
  })
})
