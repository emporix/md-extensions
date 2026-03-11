import { describe, expect, it } from 'vitest'
import { parseISODateString, toISODateString } from './timeRange.helpers'

describe('parseISODateString', () => {
  it('parses a valid ISO date string', () => {
    const parsed = parseISODateString('2026-02-20')
    expect(Number.isNaN(parsed.getTime())).toBe(false)
    expect(toISODateString(parsed)).toBe('2026-02-20')
  })

  it('returns invalid date for malformed values', () => {
    const malformed = [
      '2026-2-20',
      '2026/02/20',
      'abc',
      '',
      '2026-13-20',
      '2026-02-30',
    ]
    malformed.forEach((value) => {
      expect(Number.isNaN(parseISODateString(value).getTime())).toBe(true)
    })
  })

  it('supports valid leap day and rejects invalid one', () => {
    expect(Number.isNaN(parseISODateString('2024-02-29').getTime())).toBe(false)
    expect(Number.isNaN(parseISODateString('2023-02-29').getTime())).toBe(true)
  })
})
