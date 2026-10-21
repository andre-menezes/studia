import { describe, expect, it } from 'vitest'
import { isValidDisplayName, isValidEmail, isValidPassword } from './validation'

describe('auth validation', () => {
  it('accepts plausible emails and trims spaces', () => {
    expect(isValidEmail(' user@test.local ')).toBe(true)
    expect(isValidEmail('user@test')).toBe(false)
    expect(isValidEmail('user test@test.local')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('requires 8 to 128 characters for passwords', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('x'.repeat(128))).toBe(true)
    expect(isValidPassword('x'.repeat(129))).toBe(false)
  })

  it('requires a non-blank display name up to 80 characters', () => {
    expect(isValidDisplayName('   ')).toBe(false)
    expect(isValidDisplayName(' Ana ')).toBe(true)
    expect(isValidDisplayName('a'.repeat(81))).toBe(false)
  })
})
