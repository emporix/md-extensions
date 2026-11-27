import { describe, expect, it } from 'vitest'
import { ProductRow } from '@emporix/api-calls'
import { Item } from '../models/Quotes.model'
import { deepClone } from './utils'
import {
  buildQuoteItemsOperations,
  diffQuoteItems,
  findLinesWithoutTaxClass,
  getUnitPriceForNetValue,
  limitItemDiscount,
  mapProductRowToQuoteItem,
} from './quoteItems.helpers'

const productRow = (id: string): ProductRow =>
  ({
    id,
    imageUrl: null,
    name: id,
    code: id,
    ref: { localizedName: { en: `Product ${id}` }, id },
    price: '',
    mixins: {},
  }) as unknown as ProductRow

const quoteItem = (productId: string): Item => ({
  itemId: `item-${productId}`,
  quantity: { quantity: 2, unitCode: 'pcs' },
  price: {
    priceId: `price-${productId}`,
    unitPrice: 10,
    newUnitPrice: 10,
    totalNetValue: 20,
    tax: { taxClass: 'STANDARD', taxRate: 19 },
    discount: 0,
    currency: 'EUR',
  },
  product: { productId, name: { en: `Product ${productId}` } },
})

describe('mapProductRowToQuoteItem', () => {
  it('keeps the product id and its localized name', () => {
    expect(mapProductRowToQuoteItem(productRow('p1'))).toEqual({
      product: { productId: 'p1', name: { en: 'Product p1' } },
    })
  })
})

describe('diffQuoteItems', () => {
  it('adds picked products that are not on the quote and deletes dropped lines', () => {
    const items = [quoteItem('p1'), quoteItem('p2')]
    const products = [productRow('p2'), productRow('p3')]

    const { newItems, deletedItems } = diffQuoteItems(items, products)

    expect(newItems).toEqual([
      { product: { productId: 'p3', name: { en: 'Product p3' } } },
    ])
    expect(deletedItems).toEqual([quoteItem('p1')])
  })

  it('leaves lines that are still picked untouched', () => {
    const items = [quoteItem('p1')]
    expect(diffQuoteItems(items, [productRow('p1')])).toEqual({
      newItems: [],
      deletedItems: [],
    })
  })

  it('does not mutate the inputs', () => {
    const items = [quoteItem('p1')]
    const products = [productRow('p2')]
    const original = deepClone({ items, products })
    diffQuoteItems(items, products)
    expect({ items, products }).toEqual(original)
  })
})

describe('buildQuoteItemsOperations', () => {
  it('sends ADD /items with the priced new items and REMOVE /items with the deleted lines', () => {
    const priced = [{ product: { productId: 'p3' }, price: { unitPrice: 5 } }]
    const deleted = [quoteItem('p1')]

    expect(buildQuoteItemsOperations(priced, deleted)).toEqual([
      { op: 'ADD', path: '/items', value: priced },
      { op: 'REMOVE', path: '/items', value: deleted },
    ])
  })

  it('sends only the side that changed', () => {
    expect(buildQuoteItemsOperations([], [quoteItem('p1')])).toEqual([
      { op: 'REMOVE', path: '/items', value: [quoteItem('p1')] },
    ])
    expect(buildQuoteItemsOperations([{ product: {} }], [])).toEqual([
      { op: 'ADD', path: '/items', value: [{ product: {} }] },
    ])
  })

  it('sends nothing when no line changed', () => {
    expect(buildQuoteItemsOperations([], [])).toEqual([])
  })
})

describe('getUnitPriceForNetValue', () => {
  it('divides the net value by the quantity', () => {
    expect(getUnitPriceForNetValue(100, 4)).toBe(25)
    expect(getUnitPriceForNetValue(7.5, 2.5)).toBe(3)
  })

  // COP-7116: MD divided by a zero quantity (Infinity or NaN unit price).
  it('has no unit price for a line without a quantity', () => {
    expect(getUnitPriceForNetValue(100, 0)).toBeUndefined()
    expect(getUnitPriceForNetValue(0, 0)).toBeUndefined()
  })
})

// MD took any discount, so one above 100% gave negative prices.
describe('limitItemDiscount', () => {
  it('keeps a discount between 0 and 100%', () => {
    expect(limitItemDiscount(12.5)).toBe(12.5)
    expect(limitItemDiscount(0)).toBe(0)
    expect(limitItemDiscount(100)).toBe(100)
  })

  it('caps a discount above 100% and raises a negative one to 0', () => {
    expect(limitItemDiscount(125)).toBe(100)
    expect(limitItemDiscount(-5)).toBe(0)
  })
})

// COP-7116 QA: the quote service rejects a new line without a tax class.
describe('findLinesWithoutTaxClass', () => {
  const line = (
    productId: string,
    price?: { priceId?: string; tax?: { taxClass?: string } }
  ) => ({
    product: { productId, name: { en: productId } },
    ...(price ? { price } : {}),
  })

  it('does not list a placeholder price or a missing price (No price)', () => {
    const placeholder = line('P1', { priceId: '', tax: { taxClass: '' } })
    const missing = line('P2')
    expect(findLinesWithoutTaxClass([placeholder, missing])).toEqual([])
  })

  it('finds matched prices without a tax class', () => {
    const blankClass = line('P3', { priceId: 'PR3', tax: { taxClass: '' } })
    const noTax = line('P4', { priceId: 'PR4' })
    const taxed = line('P5', { priceId: 'PR5', tax: { taxClass: 'STANDARD' } })
    expect(findLinesWithoutTaxClass([blankClass, noTax, taxed])).toEqual([
      blankClass,
      noTax,
    ])
  })
})
