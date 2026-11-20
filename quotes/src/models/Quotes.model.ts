import { Metadata } from './Metadata.model'
import { Mixins } from './Mixins.model'
import Localized from './Localized.model'
import { EntityAddress } from './LegalEntity.model'
import { CustomerAddress } from './Customer.model'

export enum QuoteStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  DECLINED_BY_MERCHANT = 'DECLINED_BY_MERCHANT',
  EXPIRED = 'EXPIRED',
  AWAITING = 'AWAITING',
  CREATING = 'CREATING',
}

export enum QuoteStatusColor {
  OPEN = '#4543A4',
  IN_PROGRESS = '#2B95EC',
  ACCEPTED = '#1CAB2F',
  DECLINED = '#FD594D',
  DECLINED_BY_MERCHANT = '#F48032',
  EXPIRED = '#9D626B',
  AWAITING = '#6C9192',
  CREATING = '#E6C20B',
}

export interface CurrencyValue {
  currency: string
  value: number
}

export interface TotalPrice {
  currency: string
  /** Null while the tax is unknown (COP-7125: no address, unpriced items). */
  grossValue?: number | null
  netValue: number
  taxValue?: number | null
}

export interface TaxAggregate {
  lines: Line[]
}

export interface Line {
  amount: number
  name: string
  rate: number
  taxable: number
}

export interface Customer {
  customerId: string
  firstName: string
  lastName: string
}

export interface QuoteCustomer {
  customerId: string
  firstName: string
  lastName: string
  contactEmail: string
  addresses: CustomerAddress[]
}

export interface Employee {
  employeeId: string
  firstName: string
  lastName: string
}

export enum CustomerBusinessModel {
  B2B = 'B2B',
  B2C = 'B2C',
}

export interface Quote {
  approval: { approved: boolean }
  businessVersion: number
  cartId: string
  currency: string
  customer: Partial<Customer>
  employee: Partial<Employee>
  id: string
  items: Item[]
  metadata: Metadata
  shippingCost: CurrencyValue
  status: Status
  subtotalPrice: TotalPrice
  taxAggregate: TaxAggregate
  totalPrice: TotalPrice
  validTo: string
  mixins?: Mixins
  orderId?: string
  /** A quote may be created without addresses (COP-7125). */
  shippingAddress?: Address | null
  billingAddress?: Address | null
  /** True while at least one item has no price (COP-7125). */
  incompletePricing?: boolean
  siteCode: string
  company: { name: string }
  legalEntityId?: string
  comment: Comment
  shipping: Shipping
  businessModel: CustomerBusinessModel
  restriction?: string
  customerReference?: string
  customerComment?: string
}

export interface Address extends EntityAddress {
  name: string
}

export interface Comment {
  employeeComment: string
}

export interface Company {
  name: string
}

export interface Status {
  value: QuoteStatus
  comment?: string
  quoteReason?: QuoteReason
}

export interface Item {
  itemId: string
  quantity: Quantity
  /** Absent or null for a product without a price ("Price on request"). */
  price?: Price | null
  priceStatus?: PriceStatus
  product: Product
}

export type PriceStatus = 'MISSING' | 'PRICED'

export interface Quantity {
  quantity: number
  unitCode?: string
}

export type PriceType = 'INTERNAL' | 'EXTERNAL'

export interface Price {
  priceId?: string | null
  /** EXTERNAL: a net price entered by hand (COP-7125). */
  type?: PriceType
  unitPrice: number
  newUnitPrice: number
  totalNetValue: number
  tax?: Tax | null
  discount: number
  currency: string
}

export interface Product {
  productId: string
  name: Localized
}

export interface Site {
  code: string
}

export interface Prices {
  netValue: number
  grossValue: number
  taxValue: number
}

export interface Tax {
  taxClass: string | null
  /** Absent until the backend calculated it (no address yet). */
  taxRate?: number
  prices?: Prices
}

export interface TierValue {
  id: string
  priceValue: number
}

export interface QuoteCreateRequest {
  siteCode: string
  currency: string
  customerId: string
  legalEntityId?: string
  /** Omitted, never "", when no address is chosen (COP-7125). */
  shippingAddressId?: string
  billingAddressId?: string
  restriction?: string | null
}

export interface QuoteUpdateRequest {
  op: string
  path: string
  value: unknown
}

export enum QuoteEditOp {
  add = 'ADD',
  remove = 'REMOVE',
  replace = 'REPLACE',
}

export interface QuoteUpdateStatusValue {
  value: string
  quoteReasonId?: string
  comment?: string
}

export interface QuoteReason {
  id: string
  code: string
  type: QuoteChangeStatusType
  message: Localized
  metadata?: Metadata
}

export enum QuoteChangeStatusType {
  change = 'CHANGE',
  decline = 'DECLINE',
}

export interface Shipping {
  grossValue?: number
  methodName: Localized
  value: number
  methodId: string
  zoneId: string
  shippingTaxCode: string
}
