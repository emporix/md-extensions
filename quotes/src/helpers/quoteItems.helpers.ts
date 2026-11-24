import { ProductRow } from '@emporix/api-calls'
import { Item, QuoteEditOp, QuoteUpdateRequest } from '../models/Quotes.model'

export const mapProductRowToQuoteItem = (
  productRow: ProductRow
): Partial<Item> => ({
  product: {
    productId: productRow.id,
    name: productRow.ref.localizedName,
  },
})

export interface QuoteItemsDiff {
  readonly newItems: Partial<Item>[]
  readonly deletedItems: Item[]
}

/**
 * Picked products that are not on the quote yet become new items; quote lines
 * whose product is no longer picked are deleted. Lines on both sides are kept
 * as they are.
 */
export const diffQuoteItems = (
  items: readonly Item[],
  products: readonly ProductRow[]
): QuoteItemsDiff => ({
  newItems: products
    .filter(
      (product) => !items.find((item) => product.id === item.product.productId)
    )
    .map((product) => mapProductRowToQuoteItem(product)),
  deletedItems: items.filter(
    (item) => !products.find((product) => product.id === item.product.productId)
  ),
})

/**
 * `ADD /items` for the new items as priced by match-prices (their price has no
 * currency yet), `REMOVE /items` for deleted ones.
 */
export const buildQuoteItemsOperations = (
  newItemsWithPrices: readonly unknown[],
  deletedItems: readonly Item[]
): QuoteUpdateRequest[] => {
  const operations: QuoteUpdateRequest[] = []
  if (newItemsWithPrices.length > 0) {
    operations.push({
      op: QuoteEditOp.add,
      path: '/items',
      value: [...newItemsWithPrices],
    })
  }
  if (deletedItems.length > 0) {
    operations.push({
      op: QuoteEditOp.remove,
      path: '/items',
      value: [...deletedItems],
    })
  }
  return operations
}

/** A new line as match-prices priced it (`useQuotesMatchPrices`). */
type PricedLine = {
  readonly price?: {
    readonly priceId?: string
    readonly tax?: { readonly taxClass?: string }
  }
}

export interface LinesWithoutTaxClass<T> {
  /** No price matched the quote's site, currency and shipping country. */
  readonly unpriced: T[]
  /** A price matched, but it has no tax class. */
  readonly withoutTaxClass: T[]
}

/**
 * New lines the quote service rejects. It requires `price.tax.taxClass` and
 * answers "price.tax.taxClass: must not be blank" once per line, naming
 * neither the line nor the product (COP-7116 QA). A product without a
 * matched price gets a placeholder price without a class, so it is rejected
 * too. COP-7125 (emporix/md-extensions#175) adds such a product without a
 * price ("Price on request") and blocks only sending the quote, so the
 * `unpriced` part goes with it; both shapes count as unpriced here.
 */
export const findLinesWithoutTaxClass = <T extends PricedLine>(
  lines: readonly T[]
): LinesWithoutTaxClass<T> => ({
  unpriced: lines.filter((line) => !line.price?.priceId),
  withoutTaxClass: lines.filter(
    (line) => !!line.price?.priceId && !line.price.tax?.taxClass
  ),
})

/**
 * The unit price that gives a line its net value. A line without a quantity
 * has none (MD divided by the zero quantity and got Infinity or NaN).
 */
export const getUnitPriceForNetValue = (
  totalNetValue: number,
  quantity: number | undefined
): number | undefined => (quantity ? totalNetValue / quantity : undefined)

/** The range of a line discount a user can type, in percent. */
export const MIN_ITEM_DISCOUNT = 0
export const MAX_ITEM_DISCOUNT = 100

/**
 * Keeps a typed line discount between 0 and 100%. MD took any number, so a
 * discount above 100% gave negative prices.
 */
export const limitItemDiscount = (discount: number): number =>
  Math.min(MAX_ITEM_DISCOUNT, Math.max(MIN_ITEM_DISCOUNT, discount))
