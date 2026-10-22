import { describe, expect, it, vi } from 'vitest'
import {
  addNewEntries,
  addNewEntriesFromProducts,
  buildOrderQueryParams,
  extendedOrderStatusNumber,
  formatCurrency,
  getTotalAuthorizedAmount,
  removeDuplicatedEntries,
} from './orders'
import type { Order } from '../models/Order.model'

const order = (patch: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    status: 'CREATED',
    entries: [],
    customer: { id: 'c', email: 'c@x' },
    totalPrice: 10,
    currency: 'EUR',
    ...patch,
  }) as Order

describe('orders helpers', () => {
  it('addNewEntries posts entries and keeps the order id', async () => {
    const addEntries = vi.fn().mockResolvedValue(order({ id: 'other' }))
    const result = await addNewEntries(
      'o1',
      [{ productId: 'p', quantity: 1 }],
      addEntries
    )
    expect(addEntries).toHaveBeenCalledWith('o1', {
      entries: [{ productId: 'p', quantity: 1 }],
    })
    expect(result.id).toBe('o1')
  })

  it('addNewEntriesFromProducts replaces entries for picked products', async () => {
    const addEntries = vi.fn().mockResolvedValue(order())
    await addNewEntriesFromProducts(
      'o1',
      [
        { productId: 'a', quantity: 1 },
        { productId: 'b', quantity: 1 },
      ],
      [{ id: 'b', name: 'B', quantity: 3 }],
      addEntries
    )
    expect(addEntries.mock.calls[0][1].entries).toEqual([
      { productId: 'a', quantity: 1 },
      { productId: 'b', quantity: 3 },
    ])
  })

  it('removeDuplicatedEntries keeps the last entry per product', () => {
    expect(
      removeDuplicatedEntries([
        { productId: 'a', quantity: 1 },
        { productId: 'a', quantity: 2 },
      ])
    ).toEqual([{ productId: 'a', quantity: 2 }])
  })

  it('getTotalAuthorizedAmount prefers the order field, then the payment', () => {
    expect(getTotalAuthorizedAmount(order({ totalAuthorizedAmount: 5 }))).toBe(
      5
    )
    expect(
      getTotalAuthorizedAmount(
        order({
          payments: [
            { status: '', method: '', transactionId: 't', authorizedAmount: 7 },
          ],
        })
      )
    ).toBe(7)
    expect(getTotalAuthorizedAmount(order())).toBeUndefined()
  })

  it('buildOrderQueryParams excludes suborders for non-vendors only', () => {
    expect(buildOrderQueryParams(true, undefined)).toEqual({
      excludeSuborders: 'true',
    })
    expect(buildOrderQueryParams(true, 'v1')).toBeUndefined()
    expect(buildOrderQueryParams(false, undefined)).toBeUndefined()
  })

  it('formatCurrency formats and falls back', () => {
    expect(formatCurrency('EUR', 1.5, 'en')).toBe('€1.50')
    expect(formatCurrency(undefined, 1, 'en')).toBe('--')
  })

  it('extendedOrderStatusNumber parses the mixin', () => {
    expect(
      extendedOrderStatusNumber(
        order({ mixins: { generalAttributes: { extendedOrderStatus: '60' } } })
      )
    ).toBe(60)
    expect(Number.isNaN(extendedOrderStatusNumber(order()))).toBe(true)
  })
})
