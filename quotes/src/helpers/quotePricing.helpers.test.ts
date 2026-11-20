// Ported from MD `src/components/quotes/quotePricing.helpers.test.ts`
// (emporix/management-dashboard#1707, COP-7125); Jest → Vitest.
import { describe, expect, test } from 'vitest'
import {
  buildItemsUpdateOperations,
  buildStartNegotiationPayload,
  calculateDiscount,
  countUnpricedItems,
  formatTaxRate,
  hasTaxCalculated,
  hasSameAddresses,
  isExternalPrice,
  isSameShipping,
  sumGrossValues,
  withEditableTax,
} from './quotePricing.helpers'
import { Item, Price, Shipping } from '../models/Quotes.model'

const pricedItem = (over: Partial<Item> = {}, net = 100, rate = 20): Item =>
  ({
    itemId: 'i1',
    quantity: { quantity: 2, unitCode: 'pcs' },
    product: { productId: 'p1', name: { en: 'P1' } },
    price: {
      priceId: 'pr1',
      unitPrice: net / 2,
      newUnitPrice: net / 2,
      totalNetValue: net,
      tax: { taxClass: 'STD', taxRate: rate },
      discount: 0,
      currency: 'EUR',
    },
    ...over,
  }) as Item

const unpricedItem = (itemId = 'i2'): Item =>
  ({
    itemId,
    quantity: { quantity: 1 },
    product: { productId: 'p2', name: { en: 'P2' } },
    price: null,
  }) as unknown as Item

describe('countUnpricedItems', () => {
  test('counts null and absent prices', () => {
    const absent = { ...unpricedItem('i3') } as Partial<Item>
    delete absent.price
    expect(
      countUnpricedItems([pricedItem(), unpricedItem(), absent as Item])
    ).toBe(2)
  })
})

describe('formatTaxRate', () => {
  test('is blank for an unpriced row', () => {
    expect(formatTaxRate(unpricedItem())).toBe('')
  })
  test('is blank when the tax is missing', () => {
    const item = pricedItem()
    delete (item.price as { tax?: unknown }).tax
    expect(formatTaxRate(item)).toBe('')
  })
  test('formats the rate', () => {
    expect(formatTaxRate(pricedItem())).toBe('20%')
  })
})

describe('calculateDiscount', () => {
  test('is zero without a usable unit price', () => {
    expect(calculateDiscount(undefined, 10)).toBe(0)
    expect(calculateDiscount(0, 10)).toBe(0)
    expect(calculateDiscount(NaN, 10)).toBe(0)
  })
  test('computes the percentage', () => {
    expect(calculateDiscount(100, 75)).toBe(25)
  })
})

describe('sumGrossValues', () => {
  test('ignores unpriced rows', () => {
    expect(sumGrossValues([pricedItem(), unpricedItem()])).toBeCloseTo(120)
  })
  test('is zero for no priced rows', () => {
    expect(sumGrossValues([unpricedItem()])).toBe(0)
  })
  // COP-7116 QA (md-extensions#184, kept through the merge): a price can come
  // back without `tax`; MD read `price.tax.taxRate` unchecked and threw.
  test('counts a price without tax as net', () => {
    const noTax = {
      ...pricedItem(),
      price: { ...pricedItem().price, tax: undefined },
    } as unknown as Item
    expect(sumGrossValues([pricedItem(), noTax])).toBeCloseTo(220)
  })
})

describe('hasSameAddresses', () => {
  test('is false when the quote has no addresses', () => {
    expect(hasSameAddresses(null, null)).toBe(false)
    expect(hasSameAddresses(undefined, undefined)).toBe(false)
  })
  test('is true for equal ids and false otherwise', () => {
    expect(hasSameAddresses({ id: 'a' }, { id: 'a' })).toBe(true)
    expect(hasSameAddresses({ id: 'a' }, { id: 'b' })).toBe(false)
  })
})

describe('buildItemsUpdateOperations', () => {
  const entered = (itemId: string, over: Partial<Item> = {}) => ({
    ...unpricedItem(itemId),
    ...over,
  })

  test('sends nothing when nothing changed', () => {
    const loaded = [pricedItem(), unpricedItem()]
    expect(buildItemsUpdateOperations(loaded, loaded, [])).toEqual([])
  })

  test('an entered price of an unpriced row is the whole item with an EXTERNAL price', () => {
    const loaded = [unpricedItem()]
    const ops = buildItemsUpdateOperations(loaded, loaded, [42.5])
    expect(ops).toEqual([
      {
        op: 'REPLACE',
        path: '/items/i2',
        value: {
          ...unpricedItem(),
          price: { type: 'EXTERNAL', totalNetValue: 42.5 },
        },
      },
    ])
  })

  test('the entered price never uses /price and carries no priceId', () => {
    const loaded = [unpricedItem()]
    const ops = buildItemsUpdateOperations(loaded, loaded, [1], ['STD'])
    expect(ops.map((o) => o.path)).toEqual(['/items/i2'])
    expect(JSON.stringify(ops)).not.toContain('priceId')
  })

  test('an entered class travels as tax with the class only', () => {
    const loaded = [unpricedItem()]
    const [op] = buildItemsUpdateOperations(loaded, loaded, [10], ['REDUCED'])
    expect((op.value as Item).price).toEqual({
      type: 'EXTERNAL',
      totalNetValue: 10,
      tax: { taxClass: 'REDUCED' },
    })
  })

  test.each([[null], [undefined], ['']])(
    'a blank class (%p) omits the whole tax object',
    (taxClass) => {
      const loaded = [unpricedItem()]
      const [op] = buildItemsUpdateOperations(
        loaded,
        loaded,
        [10],
        [taxClass as string | null | undefined]
      )
      const price = (op.value as Item).price as unknown as Record<
        string,
        unknown
      >
      expect('tax' in price).toBe(false)
    }
  )

  test('a zero price is an entered price', () => {
    const loaded = [unpricedItem()]
    const [op] = buildItemsUpdateOperations(loaded, loaded, [0])
    expect((op.value as Item).price?.totalNetValue).toBe(0)
  })

  test('puts the echo before the item operations', () => {
    const loaded = [pricedItem(), unpricedItem()]
    const current = [
      pricedItem({ quantity: { quantity: 3, unitCode: 'pcs' } }, 150),
      unpricedItem(),
    ]
    const ops = buildItemsUpdateOperations(loaded, current, [undefined, 10])
    expect(ops.map((o) => [o.op, o.path])).toEqual([
      ['REPLACE', '/items'],
      ['REPLACE', '/items/i2'],
    ])
    const echo = ops[0].value as Item[]
    expect(echo[1].price).toBeNull()
    expect(echo[0].price?.totalNetValue).toBe(150)
  })

  test('the item operation carries the changed quantity of its row', () => {
    const loaded = [unpricedItem()]
    const current = [entered('i2', { quantity: { quantity: 4 } })]
    const ops = buildItemsUpdateOperations(loaded, current, [8])
    expect(ops.map((o) => o.path)).toEqual(['/items', '/items/i2'])
    expect((ops[1].value as Item).quantity.quantity).toBe(4)
  })

  test('a changed price of a priced row travels only in the echo', () => {
    const loaded = [pricedItem()]
    const edited = pricedItem()
    if (edited.price) {
      edited.price.totalNetValue = 80
      edited.price.discount = 20
    }
    const ops = buildItemsUpdateOperations(loaded, [edited], [])
    expect(ops.map((o) => [o.op, o.path])).toEqual([['REPLACE', '/items']])
    const echo = ops[0].value as Item[]
    expect(echo[0].price?.totalNetValue).toBe(80)
    expect(echo[0].price?.discount).toBe(20)
  })

  test('mixed: priced row echoed with its new price, one item op for the unpriced row', () => {
    const loaded = [pricedItem(), unpricedItem()]
    const edited = pricedItem()
    if (edited.price) edited.price.discount = 10
    const ops = buildItemsUpdateOperations(
      loaded,
      [edited, unpricedItem()],
      [undefined, 7]
    )
    expect(ops.map((o) => o.path)).toEqual(['/items', '/items/i2'])
    const echo = ops[0].value as Item[]
    expect(echo[0].price?.discount).toBe(10)
    expect(echo[1].price).toBeNull()
    expect((ops[1].value as Item).price).toEqual({
      type: 'EXTERNAL',
      totalNetValue: 7,
    })
  })

  test('a rounding difference after changing the quantity back sends no item op', () => {
    const loaded = [pricedItem()]
    const edited = pricedItem()
    if (edited.price) edited.price.totalNetValue = 99.99
    const ops = buildItemsUpdateOperations(loaded, [edited], [])
    expect(ops.map((o) => o.path)).toEqual(['/items'])
  })

  describe('tax class of an existing EXTERNAL price', () => {
    const external = (taxClass?: string): Item => {
      const item = pricedItem({}, 100, 19)
      const price = item.price as unknown as unknown as Record<string, unknown>
      delete price.priceId
      price.type = 'EXTERNAL'
      price.tax = taxClass ? { taxClass, taxRate: 19 } : undefined
      if (!taxClass) delete price.tax
      return item
    }

    test('an unchanged class sends nothing', () => {
      const loaded = [external('STD')]
      expect(buildItemsUpdateOperations(loaded, [external('STD')], [])).toEqual(
        []
      )
    })

    test('a new class is sent in the echo as the class only, without the stale rate', () => {
      const loaded = [external('STD')]
      const edited = external('STD')
      ;(edited.price as Price).tax = { taxClass: 'REDUCED', taxRate: 19 }
      const ops = buildItemsUpdateOperations(loaded, [edited], [])
      expect(ops.map((o) => o.path)).toEqual(['/items'])
      expect((ops[0].value as Item[])[0].price?.tax).toEqual({
        taxClass: 'REDUCED',
      })
    })

    test('a class chosen for a price that had none is sent', () => {
      const loaded = [external()]
      const edited = external()
      ;(edited.price as Price).tax = { taxClass: 'STD' }
      const ops = buildItemsUpdateOperations(loaded, [edited], [])
      expect((ops[0].value as Item[])[0].price?.tax).toEqual({
        taxClass: 'STD',
      })
    })

    test('a tax object with a blank class is never sent', () => {
      const loaded = [external()]
      const edited = external()
      ;(edited.price as Price).tax = { taxClass: null }
      edited.quantity = { quantity: 5 }
      const ops = buildItemsUpdateOperations(loaded, [edited], [])
      const price = (ops[0].value as Item[])[0].price as unknown as Record<
        string,
        unknown
      >
      expect('tax' in price).toBe(false)
    })

    test('a blank class alone is not a change', () => {
      const loaded = [external()]
      const edited = external()
      ;(edited.price as Price).tax = { taxClass: null }
      expect(buildItemsUpdateOperations(loaded, [edited], [])).toEqual([])
    })
  })
})

describe('withEditableTax', () => {
  test('gives a priced row without tax an empty class slot, so choosing a class is a detectable change', () => {
    const noTax = pricedItem()
    delete (noTax.price as Price).tax
    const [item] = withEditableTax([noTax])
    expect(item.price?.tax).toEqual({ taxClass: null })
  })
  test('leaves rows with a tax and unpriced rows untouched', () => {
    const items = [pricedItem(), unpricedItem()]
    expect(withEditableTax(items)).toEqual(items)
  })
})

describe('isExternalPrice', () => {
  test('is true only for a price of type EXTERNAL', () => {
    expect(
      isExternalPrice({ ...pricedItem().price, type: 'EXTERNAL' } as Price)
    ).toBe(true)
    expect(isExternalPrice(pricedItem().price)).toBe(false)
    expect(isExternalPrice(null)).toBe(false)
  })
})

describe('hasTaxCalculated', () => {
  test('is true only when every priced row has a numeric rate', () => {
    expect(hasTaxCalculated([pricedItem(), unpricedItem()])).toBe(true)
    const noRate = pricedItem()
    delete (noRate.price as Price).tax
    expect(hasTaxCalculated([pricedItem(), noRate])).toBe(false)
  })
  test('is true for no priced rows', () => {
    expect(hasTaxCalculated([unpricedItem()])).toBe(true)
  })
})

describe('buildStartNegotiationPayload', () => {
  test('is only the status value without reason and comment', () => {
    expect(buildStartNegotiationPayload(undefined, '')).toEqual({
      value: 'IN_PROGRESS',
    })
  })
  test('omits a blank comment', () => {
    const payload = buildStartNegotiationPayload(undefined, '   ')
    expect('comment' in payload).toBe(false)
  })
  test('keeps a typed comment as typed', () => {
    expect(buildStartNegotiationPayload(undefined, ' call me ')).toEqual({
      value: 'IN_PROGRESS',
      comment: ' call me ',
    })
  })
  test('adds the reason when one is chosen', () => {
    expect(buildStartNegotiationPayload('r1', '')).toEqual({
      value: 'IN_PROGRESS',
      quoteReasonId: 'r1',
    })
  })
  test('sends reason and comment together', () => {
    expect(buildStartNegotiationPayload('r1', 'call me')).toEqual({
      value: 'IN_PROGRESS',
      quoteReasonId: 'r1',
      comment: 'call me',
    })
  })
})

describe('isSameShipping', () => {
  const shipping = { methodId: 'm', value: 5, grossValue: 6 } as Shipping
  test('equal when both are missing or both match', () => {
    expect(isSameShipping(undefined, undefined)).toBe(true)
    expect(isSameShipping(shipping, { ...shipping })).toBe(true)
  })
  test('compares the gross rounded to cents, like the backend stores it', () => {
    const stored = { methodId: 'm', value: 4.99, grossValue: 5.94 } as Shipping
    expect(isSameShipping(stored, { ...stored, grossValue: 5.9381 })).toBe(true)
    expect(isSameShipping({ ...stored, value: 4.9899 }, stored)).toBe(true)
    expect(isSameShipping(stored, { ...stored, grossValue: 5.95 })).toBe(false)
  })
  test('differs when only one exists or method, fee or gross differ', () => {
    expect(isSameShipping(shipping, undefined)).toBe(false)
    expect(isSameShipping(undefined, shipping)).toBe(false)
    expect(isSameShipping(shipping, { ...shipping, methodId: 'x' })).toBe(false)
    expect(isSameShipping(shipping, { ...shipping, value: 0 })).toBe(false)
    expect(isSameShipping(shipping, { ...shipping, grossValue: 7 })).toBe(false)
  })
})
