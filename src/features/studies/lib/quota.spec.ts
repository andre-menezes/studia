import { describe, expect, it } from 'vitest'
import { formatRenewDate, summarizeQuota } from './quota'

const counter = {
  used: 10,
  limit: 10,
  remaining: 0,
  periodStart: '2026-10-01T03:00:00.000Z',
  periodEnd: '2026-11-01T03:00:00.000Z',
}

describe('quota helpers', () => {
  it('formats the renew date in the given locale', () => {
    const zone = 'America/Sao_Paulo'
    expect(formatRenewDate(counter.periodEnd, 'pt-BR', zone)).toMatch(/^1 de nov/)
    expect(formatRenewDate(counter.periodEnd, 'en', zone)).toBe('Nov 1')
    expect(formatRenewDate('not-a-date', 'pt-BR')).toBe('')
  })

  it('summarizes usage and flags the reached limit', () => {
    expect(summarizeQuota(counter, 'pt-BR')).toMatchObject({
      used: 10,
      limit: 10,
      reached: true,
    })
    expect(summarizeQuota({ ...counter, used: 3, remaining: 7 }, 'pt-BR')?.reached).toBe(false)
    expect(summarizeQuota(null, 'pt-BR')).toBeNull()
  })
})
