/**
 * @vitest-environment jsdom
 */
// Ported from MD `src/components/quotes/useQuotesMatchPrices.test.tsx`
// (emporix/management-dashboard#1707, COP-7125); Jest → Vitest, rendered with
// `renderHook`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { Item, Quote } from '../models/Quotes.model'
import { unpricedQuote } from '../test/quoteNullFixtures'
import {
  NoShipToCountryError,
  useQuotesMatchPrices,
} from './useQuotesMatchPrices'

const mocks = vi.hoisted(() => ({
  matchPrices: vi.fn(),
  sites: null as unknown[] | null,
}))
vi.mock('../context/SitesProvider', () => ({
  useSites: () => ({ sites: mocks.sites }),
}))
vi.mock('./api/prices', () => ({
  usePricesApi: () => ({ matchPrices: mocks.matchPrices }),
}))

const getMatcher = () =>
  renderHook(() => useQuotesMatchPrices()).result.current.getPriceForQuoteItems

const newItem = (productId: string): Partial<Item> => ({
  product: { productId, name: { en: productId } },
})

const siteWith = (shipToCountries: string[] | undefined) => ({
  code: 'main',
  shipToCountries,
})

const withAddress = () =>
  ({ ...unpricedQuote(), shippingAddress: { countryCode: 'PL' } }) as Quote

describe('useQuotesMatchPrices', () => {
  beforeEach(() => {
    mocks.sites = [siteWith(['DE', 'AT'])]
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('leaves a product without a price list entry unpriced', async () => {
    mocks.matchPrices.mockResolvedValue([])
    const [item] = await getMatcher()(unpricedQuote(), [newItem('p1')])
    expect('price' in item).toBe(false)
    // The quote service requires quantity.unitCode (not null), so '' is sent.
    expect(item.quantity).toEqual({ quantity: 1, unitCode: '' })
  })

  it('prices a product that has a price list entry', async () => {
    mocks.matchPrices.mockResolvedValue([
      {
        priceId: 'pr1',
        itemId: { itemType: 'PRODUCT', id: 'p1' },
        originalValue: 12,
        quantity: { unitCode: 'pcs' },
        tax: { taxClass: 'STD', taxRate: 19 },
      },
    ])
    const [item] = await getMatcher()(withAddress(), [newItem('p1')])
    expect(item.price).toEqual({
      priceId: 'pr1',
      unitPrice: 12,
      newUnitPrice: 12,
      totalNetValue: 12,
      tax: { taxClass: 'STD', taxRate: 19 },
      discount: 0,
    })
    expect(item.quantity).toEqual({ quantity: 1, unitCode: 'pcs' })
  })

  it('prices only the matched products of a mixed list', async () => {
    mocks.matchPrices.mockResolvedValue([
      {
        priceId: 'pr1',
        itemId: { itemType: 'PRODUCT', id: 'p1' },
        originalValue: 12,
        tax: { taxClass: 'STD', taxRate: 19 },
      },
    ])
    const items = await getMatcher()(withAddress(), [
      newItem('p1'),
      newItem('p2'),
    ])
    expect(items[0].price).toBeDefined()
    expect('price' in items[1]).toBe(false)
  })

  describe('country of the price match', () => {
    const match = [
      {
        priceId: 'pr1',
        itemId: { itemType: 'PRODUCT', id: 'p1' },
        originalValue: 12,
        tax: { taxClass: 'STD', taxRate: 19 },
      },
    ]

    it('uses the first ship-to country of the quote site without a shipping address and sends only the tax class', async () => {
      mocks.matchPrices.mockResolvedValue(match)
      const [item] = await getMatcher()(unpricedQuote(), [newItem('p1')])
      expect(mocks.matchPrices.mock.calls[0][0].targetLocation).toEqual({
        countryCode: 'DE',
      })
      expect(item.price?.priceId).toBe('pr1')
      expect(item.price?.tax).toEqual({ taxClass: 'STD' })
      expect(item.price && 'taxRate' in (item.price.tax as object)).toBe(false)
    })

    it.each([
      ['no tax', undefined],
      ['a blank tax class', { taxClass: '', taxRate: 19 }],
    ])(
      'sends no tax without an address when the match has %s',
      async (_name, tax) => {
        mocks.matchPrices.mockResolvedValue([{ ...match[0], tax }])
        const [item] = await getMatcher()(unpricedQuote(), [newItem('p1')])
        expect(item.price && 'tax' in item.price).toBe(false)
      }
    )

    it('uses the shipping address country and keeps the tax', async () => {
      mocks.matchPrices.mockResolvedValue(match)
      const [item] = await getMatcher()(withAddress(), [newItem('p1')])
      expect(mocks.matchPrices.mock.calls[0][0].targetLocation).toEqual({
        countryCode: 'PL',
      })
      expect(item.price?.tax).toEqual({ taxClass: 'STD', taxRate: 19 })
    })

    it.each([
      ['a site without ship-to countries', [siteWith([])]],
      ['a site without the field', [siteWith(undefined)]],
      ['an unknown site', [{ code: 'other', shipToCountries: ['DE'] }]],
      ['no sites loaded', null],
    ])('fails without calling price-v2 for %s', async (_name, sites) => {
      mocks.sites = sites as unknown[] | null
      await expect(
        getMatcher()(unpricedQuote(), [newItem('p1')])
      ).rejects.toBeInstanceOf(NoShipToCountryError)
      expect(mocks.matchPrices).not.toHaveBeenCalled()
    })
  })
})
