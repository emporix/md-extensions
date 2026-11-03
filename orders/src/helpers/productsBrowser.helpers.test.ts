import { describe, expect, it } from 'vitest'
import type Localized from '../models/Localized.model'
import { ProductType } from '../models/Order.model'
import type { Product } from '../models/Product.model'
import { toProductRow } from './productsBrowser.helpers'

const english = (value: Localized | string | undefined) =>
  typeof value === 'string' ? value : (value?.en ?? '')

describe('toProductRow', () => {
  const product: Product = {
    id: 'shoe-1',
    code: 'SHOE-1',
    name: { en: 'Running shoe', de: 'Laufschuh' },
    productType: ProductType.basic,
    media: [{ url: 'https://res.cloudinary.com/x/upload/shoe.png' }],
  }

  it('maps a product to a row with a sized thumbnail', () => {
    expect(toProductRow(product, english)).toEqual({
      id: 'shoe-1',
      code: 'SHOE-1',
      name: 'Running shoe',
      imageUrl:
        'https://res.cloudinary.com/x/upload/c_pad,q_auto,f_auto,dpr_1,h_32,w_32/shoe.png',
      productType: 'BASIC',
      product,
    })
  })

  it('has no image for a product without media', () => {
    expect(toProductRow({ ...product, media: [] }, english).imageUrl).toBeNull()
  })

  it('shows the first image when other media come first', () => {
    const media = [
      {
        url: 'https://cdn.example.com/manual.pdf',
        contentType: 'application/pdf',
      },
      { url: 'https://cdn.example.com/shoe.png', contentType: 'image/png' },
    ]

    expect(toProductRow({ ...product, media }, english).imageUrl).toBe(
      'https://cdn.example.com/shoe.png'
    )
  })

  it('has no image when the media hold no image', () => {
    const media = [
      { url: 'https://cdn.example.com/clip.mp4', contentType: 'video/mp4' },
    ]

    expect(toProductRow({ ...product, media }, english).imageUrl).toBeNull()
  })
})
