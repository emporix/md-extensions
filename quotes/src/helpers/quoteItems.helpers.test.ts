import { describe, expect, it } from 'vitest'
import { ProductRow } from '@emporix/api-calls'
import { Item } from '../models/Quotes.model'
import { deepClone } from './utils'
import {
  buildQuoteItemsOperations,
  diffQuoteItems,
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
