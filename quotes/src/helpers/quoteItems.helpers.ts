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
