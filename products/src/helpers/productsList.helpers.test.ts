import { describe, expect, it } from 'vitest'
import type { ProductRow } from '@emporix/api-calls'
import type Localized from '../models/Localized.model'
import {
  pageFromSearchParams,
  toProductsListRow,
  visibleProductColumns,
} from './productsList.helpers'

const german = (value: Localized | string | undefined) =>
  typeof value === 'string' ? value : (value?.de ?? '')

const row = {
  id: 'shoe-1',
  imageUrl: 'https://res.cloudinary.com/x/upload/shoe.png',
  name: 'Running shoe',
  code: 'SHOE-1',
  productType: 'BASIC',
  ref: { id: 'shoe-1', localizedName: { en: 'Running shoe', de: 'Laufschuh' } },
  price: '€10.00',
  mixins: {},
  vendorName: '',
} as ProductRow

describe('toProductsListRow', () => {
  it('names the row in the content language and sizes the thumbnail', () => {
    expect(toProductsListRow(row, german)).toEqual({
      ...row,
      name: 'Laufschuh',
      imageUrl:
        'https://res.cloudinary.com/x/upload/c_pad,q_auto,f_auto,dpr_1,h_32,w_32/shoe.png',
    })
  })

  it('has no image for a product without one', () => {
    expect(toProductsListRow({ ...row, imageUrl: null }, german).imageUrl).toBe(
      null
    )
  })

  it('does not change the given row', () => {
    const copy = structuredClone(row)

    toProductsListRow(row, german)

    expect(row).toEqual(copy)
  })
})

describe('visibleProductColumns', () => {
  it('shows every column without saved settings', () => {
    expect(visibleProductColumns([])).toEqual([
      'imageUrl',
      'name',
      'id',
      'code',
      'productType',
      'vendorName',
      'price',
    ])
  })

  it('hides the columns the settings hide and keeps unknown ones', () => {
    expect(
      visibleProductColumns([
        { key: 'price', label: 'Price', visible: false },
        { key: 'vendorName', label: 'Vendor', visible: false },
        { key: 'code', label: 'Code', visible: true },
        { key: 'removed', label: 'Removed', visible: true },
      ])
    ).toEqual(['imageUrl', 'name', 'id', 'code', 'productType'])
  })
})

describe('pageFromSearchParams', () => {
  it('reads the page and rows of the URL', () => {
    expect(pageFromSearchParams(new URLSearchParams('page=3&rows=25'))).toEqual(
      { currentPage: 3, rows: 25 }
    )
  })

  it('ignores a missing or invalid page', () => {
    expect(pageFromSearchParams(new URLSearchParams(''))).toBeUndefined()
    expect(
      pageFromSearchParams(new URLSearchParams('page=0&rows=25'))
    ).toBeUndefined()
    expect(
      pageFromSearchParams(new URLSearchParams('page=2&rows=x'))
    ).toBeUndefined()
  })
})
