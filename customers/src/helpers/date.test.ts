import { describe, it, expect } from 'vitest'
import { getDateString, isSameDay } from './date'

describe('date helpers', () => {
  it('getDateString returns YYYY-MM prefix', () => {
    const s = getDateString('2024-06-15T12:00:00.000Z')
    expect(s).toMatch(/^\d{4}-\d{2}$/)
  })

  it('isSameDay compares calendar days', () => {
    const a = new Date('2024-01-10T08:00:00.000Z')
    const b = new Date('2024-01-10T22:00:00.000Z')
    expect(isSameDay(a, b)).toBe(true)
  })
})
