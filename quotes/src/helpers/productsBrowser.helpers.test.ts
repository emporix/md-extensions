import { describe, expect, it } from 'vitest'
import { toQuoteProductRow } from './productsBrowser.helpers'
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
