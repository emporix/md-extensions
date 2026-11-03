import { describe, expect, it } from 'vitest'
import { toCalendarDate } from './date'

describe('toCalendarDate', () => {
  it('returns undefined for null, undefined and empty strings', () => {
    expect(toCalendarDate(null)).toBeUndefined()
    expect(toCalendarDate(undefined)).toBeUndefined()
    expect(toCalendarDate('')).toBeUndefined()
  })

  it('keeps the Unix epoch timestamp', () => {
    expect(toCalendarDate(0)?.getTime()).toBe(0)
  })

  it('parses valid strings and numbers', () => {
    expect(toCalendarDate('2024-01-02T00:00:00Z')?.toISOString()).toBe(
      '2024-01-02T00:00:00.000Z'
    )
    expect(toCalendarDate(1704153600000)?.getTime()).toBe(1704153600000)
  })

  it('returns undefined for invalid dates and unsupported types', () => {
    expect(toCalendarDate('not a date')).toBeUndefined()
    expect(toCalendarDate(new Date('invalid'))).toBeUndefined()
    expect(toCalendarDate({})).toBeUndefined()
  })

  it('returns valid Date instances unchanged', () => {
    const date = new Date('2024-01-02T00:00:00Z')
    expect(toCalendarDate(date)).toBe(date)
  })
})
