export type Plan = 'FREE' | 'PREMIUM'

export type Capability = string

export type LimitKey = string

export type Entitlements = {
  capabilities: Capability[]
  limits: Record<string, number>
}

export type UsageCounter = {
  used: number
  limit: number
  remaining: number
  /** ISO instant the period started (ADR-0009). */
  periodStart: string
  /** ISO instant the counter renews (exclusive end). */
  periodEnd: string
}

export type Usage = {
  studyCreationsThisPeriod: UsageCounter
}

export type User = {
  id: string
  email: string
  displayName: string
  /** IANA zone of the quota period (ADR-0009). */
  timeZone?: string
}
