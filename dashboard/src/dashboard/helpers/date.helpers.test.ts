import { describe, expect, it } from 'vitest'
import {
  formatShortDate,
  formatDateTimeNumeric,
  formatDateTimeShort,
  formatRelativeDate,
  formatStatus,
} from './date.helpers'

describe('formatShortDate', () => {
  it('formats valid ISO date', () => {
    expect(formatShortDate('2024-03-15T10:00:00Z')).toBe('03/15/2024')
  })

  it('returns dash for undefined', () => {
    expect(formatShortDate(undefined)).toBe('—')
  })

  it('returns dash for invalid date', () => {
    expect(formatShortDate('not-a-date')).toBe('—')
  })

  it('returns dash for empty string', () => {
    expect(formatShortDate('')).toBe('—')
  })
})

describe('formatDateTimeNumeric', () => {
  it('returns dash for undefined', () => {
    expect(formatDateTimeNumeric(undefined)).toBe('—')
  })

  it('returns original for invalid date', () => {
    expect(formatDateTimeNumeric('bad')).toBe('bad')
  })

  it('returns locale-formatted string for valid date', () => {
    const result = formatDateTimeNumeric('2024-06-01T14:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('formatDateTimeShort', () => {
  it('returns dash for undefined', () => {
    expect(formatDateTimeShort(undefined)).toBe('—')
  })

  it('returns locale-formatted string for valid date', () => {
    const result = formatDateTimeShort('2024-06-01T14:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('formatRelativeDate', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  it('returns "Today" for same-day dates', () => {
    expect(formatRelativeDate('2024-06-15T08:00:00Z', now)).toBe('Today')
  })

  it('returns "1 day" for yesterday', () => {
    expect(formatRelativeDate('2024-06-14T08:00:00Z', now)).toBe('1 day')
  })

  it('returns "X days" for 2-6 days ago', () => {
    expect(formatRelativeDate('2024-06-12T08:00:00Z', now)).toBe('3 days')
  })

  it('returns MM/DD/YYYY for 7+ days ago', () => {
    expect(formatRelativeDate('2024-06-01T08:00:00Z', now)).toBe('06/01/2024')
  })

  it('returns dash for undefined', () => {
    expect(formatRelativeDate(undefined, now)).toBe('—')
  })

  it('returns original string for invalid date', () => {
    expect(formatRelativeDate('bad-date', now)).toBe('bad-date')
  })

  it('uses translation function when provided', () => {
    const t = (key: string) => {
      if (key === 'date.today') return 'Heute'
      return key
    }
    expect(formatRelativeDate('2024-06-15T08:00:00Z', now, t)).toBe('Heute')
  })

  it('replaces {count} in translation', () => {
    const t = (key: string, params?: Record<string, string | number>) => {
      if (key === 'date.days') {
        const template = '{count} Tage'
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
          name in params ? String(params[name]) : `{${name}}`
        )
      }
      return key
    }
    expect(formatRelativeDate('2024-06-12T08:00:00Z', now, t)).toBe('3 Tage')
  })
})

describe('formatStatus', () => {
  it('uppercases and replaces underscores', () => {
    expect(formatStatus('in_progress')).toBe('IN PROGRESS')
  })

  it('handles already uppercase', () => {
    expect(formatStatus('SHIPPED')).toBe('SHIPPED')
  })

  it('returns dash for undefined', () => {
    expect(formatStatus(undefined)).toBe('—')
  })

  it('returns dash for empty string', () => {
    expect(formatStatus('')).toBe('—')
  })
})
