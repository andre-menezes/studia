/** Client-side checks only for fast feedback; the API remains the authority. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const DISPLAY_NAME_MAX_LENGTH = 80

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH
}

export function isValidDisplayName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= DISPLAY_NAME_MAX_LENGTH
}

/** Browser IANA time zone for the quota period (ADR-0009), or undefined. */
export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}
