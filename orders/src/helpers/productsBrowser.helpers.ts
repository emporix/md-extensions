import type { ProductsBrowserRow } from '@emporix/component-library'
import type Localized from '../models/Localized.model'
import type { Product } from '../models/Product.model'
import { trimCloudinaryImage } from './images'

/** A row of the add-entry products browser; keeps the product it shows. */
export type AddEntryProductRow = ProductsBrowserRow & { product: Product }

type GetLocalizedValue = (value: Localized | string | undefined) => string

export const toProductRow = (
  product: Product,
  getName: GetLocalizedValue
): AddEntryProductRow => {
  // Media can also hold PDFs or videos; like MD, show the first image.
  const imageUrl = product.media?.find(
    (media) => !media.contentType || media.contentType.startsWith('image/')
  )?.url
  return {
    id: product.id,
    code: product.code,
    name: getName(product.name),
    imageUrl: imageUrl ? trimCloudinaryImage(imageUrl, 32, 32) : null,
    productType: product.productType,
    product,
  }
}
