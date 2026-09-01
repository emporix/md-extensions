import { Metadata } from './Metadata.model'
import { Mixins } from './Mixins.model'

/**
 * Lean subset of the Management Dashboard `Order` model — only the fields the
 * Returns screens read. Do not grow this into a full order model; the orders
 * module owns that.
 */

export interface TaxedPrice {
  grossValue: number
  netValue: number
  taxValue?: number
  currency?: string
}

export interface EntryCalculatedPrice {
  finalPrice?: TaxedPrice
}

export interface OrderProduct {
  id: string
  name: string
  code?: string
}

export interface Entry {
  id: string
  amount: number
  unitPrice: number
  totalPrice: number
  product: OrderProduct
  metadata?: Metadata
  mixins?: Mixins
  calculatedPrice?: EntryCalculatedPrice
  calculatedUnitPrice?: TaxedPrice
}

export interface OrderCustomer {
  id: string
  firstName?: string
  lastName?: string
  email: string
}

export interface Order {
  id: string
  created?: Date
  entries: Entry[]
  customer: OrderCustomer
  currency: string
  metadata?: Metadata
}
