import { describe, expect, it } from 'vitest'
import type { SalesOrderApiResponse } from '../api/orders.api'
import {
  getOrderCustomerDisplayName,
  formatOrderStatus,
  formatOrderDateForTimeline,
  formatOrderDate,
  getOrderCreated,
  getOrdersByCountry,
  formatOrderTotal,
} from './order.helpers'

const makeOrder = (
  overrides: Partial<SalesOrderApiResponse> = {}
): SalesOrderApiResponse => ({
  id: 'o1',
  status: 'CREATED',
  ...overrides,
})

describe('getOrderCustomerDisplayName', () => {
  it('returns customer name', () => {
    const order = makeOrder({ customer: { id: '1', name: 'Acme Corp' } })
    expect(getOrderCustomerDisplayName(order)).toBe('Acme Corp')
  })

  it('returns first + last when no name', () => {
    const order = makeOrder({
      customer: { id: '1', firstName: 'Jane', lastName: 'Doe' },
    })
    expect(getOrderCustomerDisplayName(order)).toBe('Jane Doe')
  })

  it('falls back to email', () => {
    const order = makeOrder({ customer: { id: '1', email: 'a@b.com' } })
    expect(getOrderCustomerDisplayName(order)).toBe('a@b.com')
  })

  it('returns dash when no customer', () => {
    expect(getOrderCustomerDisplayName(makeOrder())).toBe('—')
  })
})

describe('formatOrderStatus', () => {
  it('delegates to formatStatus', () => {
    expect(formatOrderStatus('in_progress')).toBe('IN PROGRESS')
  })
})

describe('formatOrderDateForTimeline', () => {
  it('returns Today for same-day date', () => {
    const now = new Date('2024-06-15T12:00:00Z')
    expect(formatOrderDateForTimeline('2024-06-15T08:00:00Z', now)).toBe(
      'Today'
    )
  })
})

describe('formatOrderDate', () => {
  it('returns dash for undefined', () => {
    expect(formatOrderDate(undefined)).toBe('—')
  })

  it('returns formatted string for valid date', () => {
    const result = formatOrderDate('2024-06-01T14:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('getOrderCreated', () => {
  it('returns created field', () => {
    expect(getOrderCreated(makeOrder({ created: '2024-01-01' }))).toBe(
      '2024-01-01'
    )
  })

  it('returns undefined when missing', () => {
    expect(getOrderCreated(makeOrder())).toBeUndefined()
  })
})

describe('getOrdersByCountry', () => {
  it('aggregates orders by country', () => {
    const orders = [
      makeOrder({ shippingAddress: { country: 'DE' } }),
      makeOrder({ shippingAddress: { country: 'de' } }),
      makeOrder({ shippingAddress: { country: 'US' } }),
    ]
    const map = getOrdersByCountry(orders)
    expect(map.get('DE')).toBe(2)
    expect(map.get('US')).toBe(1)
  })

  it('returns empty map for no orders', () => {
    expect(getOrdersByCountry([]).size).toBe(0)
  })

  it('skips orders without shipping address', () => {
    const orders = [makeOrder(), makeOrder({ shippingAddress: {} })]
    expect(getOrdersByCountry(orders).size).toBe(0)
  })
})

describe('formatOrderTotal', () => {
  it('formats gross value with currency', () => {
    const order = makeOrder({
      currency: 'EUR',
      calculatedPrice: { finalPrice: { grossValue: 99.5 } },
    })
    const result = formatOrderTotal(order)
    expect(result).not.toBe('—')
  })

  it('returns dash when gross is missing', () => {
    expect(formatOrderTotal(makeOrder())).toBe('—')
  })
})
