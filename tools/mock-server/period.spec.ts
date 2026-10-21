import { describe, expect, it } from 'vitest'
import { monthlyPeriod } from './period'

describe('monthlyPeriod (ADR-0009)', () => {
  it('uses the calendar month in the user time zone', () => {
    expect(monthlyPeriod('America/Sao_Paulo', Date.parse('2026-10-21T12:00:00Z'))).toEqual({
      key: '2026-10',
      periodStart: '2026-10-01T03:00:00.000Z',
      periodEnd: '2026-11-01T03:00:00.000Z',
    })
  })

  it('keeps the previous month until local midnight', () => {
    // 2026-11-01T02:30Z is still Oct 31 in São Paulo.
    expect(monthlyPeriod('America/Sao_Paulo', Date.parse('2026-11-01T02:30:00Z')).key).toBe(
      '2026-10',
    )
  })

  it('rolls over December into the next year', () => {
    expect(monthlyPeriod('UTC', Date.parse('2026-12-31T23:59:59Z'))).toMatchObject({
      key: '2026-12',
      periodEnd: '2027-01-01T00:00:00.000Z',
    })
  })

  it('follows DST changes inside the month', () => {
    expect(monthlyPeriod('Europe/Berlin', Date.parse('2026-03-15T00:00:00Z'))).toMatchObject({
      periodStart: '2026-02-28T23:00:00.000Z',
      periodEnd: '2026-03-31T22:00:00.000Z',
    })
  })

  it('starts at the first local instant of the 1st when midnight is skipped', () => {
    // Asunción jumped from 00:00 to 01:00 on 2023-10-01 (UTC-4 → UTC-3).
    expect(
      monthlyPeriod('America/Asuncion', Date.parse('2023-10-10T12:00:00Z')).periodStart,
    ).toBe('2023-10-01T04:00:00.000Z')
  })
})
