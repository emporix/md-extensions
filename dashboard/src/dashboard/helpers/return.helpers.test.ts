import { describe, expect, it } from 'vitest'
import type { ReturnApiResponse } from '../api/returns.api'
import {
  getReturnRequestorDisplayName,
  formatReturnStatus,
  getReturnCreated,
  formatReturnDate,
  formatReturnTotal,
} from './return.helpers'

const makeReturn = (
  overrides: Partial<ReturnApiResponse> = {}
): ReturnApiResponse => ({
  id: 'r1',
  approvalStatus: 'PENDING',
  ...overrides,
})

describe('getReturnRequestorDisplayName', () => {
  it('returns first + last name', () => {
    const r = makeReturn({
      requestor: { firstName: 'Jane', lastName: 'Doe' },
    })
    expect(getReturnRequestorDisplayName(r)).toBe('Jane Doe')
  })

  it('falls back to email', () => {
    const r = makeReturn({ requestor: { email: 'j@test.com' } })
    expect(getReturnRequestorDisplayName(r)).toBe('j@test.com')
  })

  it('returns dash when no requestor', () => {
    expect(getReturnRequestorDisplayName(makeReturn())).toBe('—')
  })
})

describe('formatReturnStatus', () => {
  it('delegates to formatStatus', () => {
    expect(formatReturnStatus('pending_review')).toBe('PENDING REVIEW')
  })
})

describe('getReturnCreated', () => {
  it('returns metadata.createdAt', () => {
    const r = makeReturn({ metadata: { createdAt: '2024-01-01' } })
    expect(getReturnCreated(r)).toBe('2024-01-01')
  })

  it('returns undefined when missing', () => {
    expect(getReturnCreated(makeReturn())).toBeUndefined()
  })
})

describe('formatReturnDate', () => {
  it('returns dash for undefined', () => {
    expect(formatReturnDate(undefined)).toBe('—')
  })

  it('returns formatted string for valid date', () => {
    const result = formatReturnDate('2024-06-01T14:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('formatReturnTotal', () => {
  it('sums order totals', () => {
    const r = makeReturn({
      orders: [
        { id: 'o1', total: { value: 50, currency: 'EUR' } },
        { id: 'o2', total: { value: 30, currency: 'EUR' } },
      ],
    })
    const result = formatReturnTotal(r)
    expect(result).not.toBe('—')
  })

  it('returns dash when no orders', () => {
    expect(formatReturnTotal(makeReturn())).toBe('—')
  })

  it('returns dash when orders is empty', () => {
    expect(formatReturnTotal(makeReturn({ orders: [] }))).toBe('—')
  })
})
