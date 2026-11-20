import { describe, expect, it } from 'vitest'
import { ShippingMethod, Zone } from '../models/Shipping.model'
import { deepClone } from './utils'
import {
  filterQuoteShippingMethods,
  getZoneShippingMethods,
  selectShippingFee,
} from './quoteShipping.helpers'

const method = (
  id: string,
  overrides: Partial<ShippingMethod> = {}
): ShippingMethod =>
  ({
    id,
    name: { en: id },
    active: true,
    fees: [
      { minOrderValue: { amount: 0, currency: 'EUR' }, cost: { amount: 9 } },
    ],
    maxOrderValue: { amount: 0, currency: 'EUR' },
    shippingTaxCode: 'SHIPPING',
    ...overrides,
  }) as ShippingMethod

const zone = (id: string, countries: string[], methods: ShippingMethod[]) =>
  ({
    id,
    name: { en: id },
    shipTo: countries.map((country) => ({ country })),
    methods,
  }) as Zone

describe('getZoneShippingMethods', () => {
  const zones = [
    zone('de', ['DE', 'AT'], [method('standard'), method('express')]),
    zone('pl', ['PL'], [method('pl-standard')]),
    { id: 'empty', name: { en: 'empty' }, shipTo: [{ country: 'DE' }] } as Zone,
  ]

  it('takes the methods of every zone that ships to the country, tagged with the zone', () => {
    const methods = getZoneShippingMethods(zones, 'DE')
    expect(methods.map((m) => [m.id, m.zoneId])).toEqual([
      ['standard', 'de'],
      ['express', 'de'],
    ])
  })

  it('offers nothing for a country no zone ships to, or without a country', () => {
    expect(getZoneShippingMethods(zones, 'FR')).toEqual([])
    expect(getZoneShippingMethods(zones, undefined)).toEqual([])
  })

  it('does not mutate the zones', () => {
    const original = deepClone(zones)
    getZoneShippingMethods(zones, 'DE')
    expect(zones).toEqual(original)
  })
})

describe('filterQuoteShippingMethods', () => {
  it('drops methods without a shipping tax code', () => {
    const methods = [
      method('taxed'),
      method('untaxed', { shippingTaxCode: undefined }),
      method('empty-code', { shippingTaxCode: '' }),
    ]
    expect(
      filterQuoteShippingMethods(methods, 50, 'EUR').map((m) => m.id)
    ).toEqual(['taxed'])
  })

  it('caps the subtotal with a maximum order value in the quote currency', () => {
    const capped = method('capped', {
      maxOrderValue: { amount: 100, currency: 'EUR' },
    })
    expect(filterQuoteShippingMethods([capped], 100, 'EUR')).toHaveLength(1)
    expect(filterQuoteShippingMethods([capped], 100.01, 'EUR')).toHaveLength(0)
  })

  it('ignores a zero maximum or one in another currency', () => {
    const zero = method('zero', {
      maxOrderValue: { amount: 0, currency: 'EUR' },
    })
    const otherCurrency = method('usd', {
      maxOrderValue: { amount: 10, currency: 'USD' },
    })
    expect(
      filterQuoteShippingMethods([zero, otherCurrency], 1000, 'EUR').map(
        (m) => m.id
      )
    ).toEqual(['zero', 'usd'])
  })
})

describe('selectShippingFee', () => {
  const tiered = method('tiered', {
    fees: [
      { minOrderValue: { amount: 0, currency: 'EUR' }, cost: { amount: 9 } },
      { minOrderValue: { amount: 50, currency: 'EUR' }, cost: { amount: 4 } },
      { minOrderValue: { amount: 200, currency: 'EUR' }, cost: { amount: 0 } },
    ],
  } as Partial<ShippingMethod>)

  it('takes the cheapest fee whose minimum order value is reached', () => {
    expect(selectShippingFee(tiered, 10).cost.amount).toBe(9)
    expect(selectShippingFee(tiered, 50).cost.amount).toBe(4)
    expect(selectShippingFee(tiered, 250).cost.amount).toBe(0)
  })

  it('falls back to the first fee when no minimum is reached', () => {
    const highMinimum = method('high', {
      fees: [
        {
          minOrderValue: { amount: 100, currency: 'EUR' },
          cost: { amount: 7 },
        },
        {
          minOrderValue: { amount: 500, currency: 'EUR' },
          cost: { amount: 1 },
        },
      ],
    } as Partial<ShippingMethod>)
    expect(selectShippingFee(highMinimum, 10).cost.amount).toBe(7)
  })

  it('does not reorder the method fees', () => {
    const original = deepClone(tiered)
    selectShippingFee(tiered, 250)
    expect(tiered).toEqual(original)
  })
})
