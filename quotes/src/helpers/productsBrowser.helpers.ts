import { mapProductToProductRow, type ProductRow } from '@emporix/api-calls'
import type Localized from '../models/Localized.model'
import type { Product } from '../models/Product.model'

type GetLocalizedValue = (value: Localized | string | undefined) => string

type ApiProduct = Parameters<typeof mapProductToProductRow>[0]

/**
 * A product as the Products tab picker lists and picks it: the row of MD
 * `syncPaginatedProductsRows` without prices (the picker has no price
 * column), named in the content language as MD's name column showed it. The
 * component library's browser shows `name` as it is.
 */
export const toQuoteProductRow = (
  product: Product,
  getName: GetLocalizedValue
): ProductRow => {
  if (!product.id) {
    throw new Error('no product id')
  }
  return {
    ...mapProductToProductRow(product as unknown as ApiProduct, 0, ''),
    name: getName(product.name),
  }
}
