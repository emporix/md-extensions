import Localized from './Localized.model'
import { ProductType } from './Order.model'

export interface ProductMedia {
  id?: string
  url: string
}

/**
 * Lean product shape for the "add entry" dialog and bundle expansion —
 * only the fields the order screens read.
 */
export interface Product {
  id: string
  name: Localized | string
  code?: string
  productType?: ProductType
  media?: ProductMedia[]
  /** Local-only: quantity picked in the add-entry dialog. */
  quantity?: number
}
