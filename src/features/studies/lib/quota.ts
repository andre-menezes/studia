import type { UsageCounter } from '@/types/entitlements'

/**
 * Short renew date ("1 de nov.") from the server period end (ADR-0009).
 * Pass the user's zone (`user.timeZone`) so the date matches the server period.
 */
export function formatRenewDate(periodEnd: string, locale: string, timeZone?: string): string {
  const date = new Date(periodEnd)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone }).format(date)
}

export type QuotaSummary = {
  used: number
  limit: number
  renewsAt: string
  reached: boolean
}

export function summarizeQuota(
  counter: UsageCounter | null | undefined,
  locale: string,
  timeZone?: string,
): QuotaSummary | null {
  if (!counter) return null
  return {
    used: counter.used,
    limit: counter.limit,
    renewsAt: formatRenewDate(counter.periodEnd, locale, timeZone),
    reached: counter.remaining <= 0,
  }
}
