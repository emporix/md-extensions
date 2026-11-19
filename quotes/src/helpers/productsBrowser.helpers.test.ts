import { describe, expect, it } from 'vitest'
import { hasSameIds, toQuoteProductRow } from './productsBrowser.helpers'
import type { Product } from '../models/Product.model'
import type Localized from '../models/Localized.model'

const inContentLanguage = (value: Localized | string | undefined) =>
  typeof value === 'string' ? value : (value?.de ?? '--')

describe('toQuoteProductRow', () => {
  it('keeps the localized name for the quote item and shows the content language', () => {
    const product = {
      id: 'P1',
      code: 'SKU-1',
      name: { en: 'Chair', de: 'Stuhl' },
      productType: 'BASIC',
      media: [
        { url: 'https://cdn/manual.pdf', contentType: 'application/pdf' },
        { url: 'https://cdn/chair.png', contentType: 'image/png' },
      ],
    } as unknown as Product

    expect(toQuoteProductRow(product, inContentLanguage)).toMatchObject({
      id: 'P1',
      code: 'SKU-1',
      name: 'Stuhl',
      productType: 'BASIC',
      imageUrl: 'https://cdn/chair.png',
      ref: { id: 'P1', localizedName: { en: 'Chair', de: 'Stuhl' } },
    })
  })

  it('fails the page for a product without id, as MD did', () => {
    expect(() =>
      toQuoteProductRow({ name: 'x' } as Product, inContentLanguage)
    ).toThrow('no product id')
  })
})

describe('hasSameIds', () => {
  it('is true for the same ids in another order', () => {
    expect(
      hasSameIds([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'a' }])
    ).toBe(true)
  })

  it('is true for two empty lists', () => {
    expect(hasSameIds([], [])).toBe(true)
  })

  it('is false when an id was added or removed', () => {
    expect(hasSameIds([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }])).toBe(false)
    expect(hasSameIds([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }])).toBe(false)
  })

  it('is false when one id was swapped for another', () => {
    expect(
      hasSameIds([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }, { id: 'c' }])
    ).toBe(false)
  })

  it('does not mutate its input', () => {
    const first = [{ id: 'b' }, { id: 'a' }]
    hasSameIds(first, [{ id: 'a' }])
    expect(first).toEqual([{ id: 'b' }, { id: 'a' }])
  })
})
