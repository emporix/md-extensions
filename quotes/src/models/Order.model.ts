import Localized from './Localized.model'
import { Metadata } from './Metadata.model'
import { Mixins } from './Mixins.model'

/**
 * Order domain types, ported from the Management Dashboard `models/Order.ts`.
 * `@emporix/api-calls` exports the order calls but not these models, so they
 * are declared here and cast at the call boundary in `hooks/api/orders.ts`.
 */

export enum OrderStatus {
  IN_CHECKOUT = 'IN_CHECKOUT',
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
}

export const OrderStatusColor: Record<OrderStatus, string> = {
  IN_CHECKOUT: '#6589AB',
  CREATED: '#C98921',
  CONFIRMED: '#2AA28D',
  DECLINED: '#E8615A',
  SHIPPED: '#3B73BB',
  COMPLETED: '#42a64e',
}

export enum ItemType {
  EXTERNAL = 'EXTERNAL',
  INTERNAL = 'INTERNAL',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  ABSOLUTE = 'ABSOLUTE',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum ProductType {
  basic = 'BASIC',
  variant = 'VARIANT',
  parentVariant = 'PARENT_VARIANT',
  bundle = 'BUNDLE',
}

export enum CalculationType {
  APPLY_DISCOUNT_BEFORE_TAX = 'ApplyDiscountBeforeTax',
  APPLY_DISCOUNT_AFTER_TAX = 'ApplyDiscountAfterTax',
}

/** Well-known order mixins read by the order screens. */
export interface OrderMixins extends Mixins {
  generalAttributes?: {
    extendedOrderStatus?: string
    [key: string]: unknown
  }
  invoice?: Invoice
  payment?: { paymentType?: string; [key: string]: unknown }
  deliveryTime?: {
    deliveryTimeFrom?: string
    deliveryTimeTo?: string
    deliveryDate?: string
    [key: string]: unknown
  }
  deliveryOptions?: { personalHandover?: boolean; [key: string]: unknown }
}

export interface EntryMixins extends Mixins {
  pliPicking?: { deliveryAmount?: number; [key: string]: unknown }
}

export interface CustomerMixins extends Mixins {
  generalAttributes?: {
    customerType?: string
    customerNumber?: string
    birthday?: string
    [key: string]: unknown
  }
}

export interface AddressMixins extends Mixins {
  customAttributes?: { vatId?: string; [key: string]: unknown }
}

export interface Channel {
  name: string
  source: string
}

export interface Image {
  id: string
  url: string
}

export interface BundleProduct {
  productId: string
  amount: number
}

export interface OrderProduct {
  description?: string
  name: string
  sku?: string
  published?: boolean
  images?: Image[]
  metadata?: Metadata
  localizedName?: Localized
  mixins?: Mixins
  id: string
  productType?: ProductType
  bundledProducts?: BundleProduct[]
}

export interface Variant {
  id: string
  name: string
  code: string
  images: Image[]
  options: Record<string, unknown>
  mixins: Mixins
}

export interface TaxedPrice {
  netValue: number
  grossValue: number
  taxValue: number
  taxCode: string
  taxRate: number
}

export interface CalculatedAppliedDiscount {
  id: string
  value: number
  discountType: DiscountType
  origin: ItemType
  price: TaxedPrice
}

export interface DiscountedPrice extends TaxedPrice {
  appliedDiscounts: CalculatedAppliedDiscount[]
}

export interface TotalDiscount {
  calculationType: CalculationType
  value: number
  appliedDiscounts: CalculatedAppliedDiscount[]
  price: TaxedPrice
}

export interface EntryCalculatedPriceFee {
  id: string
  type: DiscountType
  origin: ItemType
  name: Localized
  price: TaxedPrice
  discountedPrice: DiscountedPrice
  totalFee: DiscountedPrice
}

export interface EntryCalculatedPrice {
  price: TaxedPrice
  upliftValue: TaxedPrice
  discountedPrice: DiscountedPrice
  fees: EntryCalculatedPriceFee[]
  totalFee: DiscountedPrice
  totalDiscount: TotalDiscount
  finalPrice: TaxedPrice
}

export interface Entry {
  id: string
  amount: number
  orderedAmount: number
  originalAmount?: number
  originalPrice?: number
  unitPrice: number
  totalPrice: number
  authorizedAmount?: number
  link?: string
  product: OrderProduct
  variant?: Variant
  metadata?: Metadata
  mixins?: EntryMixins
  calculatedPrice?: EntryCalculatedPrice
  calculatedUnitPrice?: TaxedPrice
}

export interface Link {
  id: string
  type: string
  url: string
}

export interface Discount {
  id: string
  code: string
  name: string
  amount: number
  currency: string
  discountRate: number
  sequenceId: number
  link: Link
}

export interface OrderCustomer {
  id: string
  title?: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  company?: string
  metadata?: Metadata
  mixins?: CustomerMixins
}

export interface Payment {
  status: string
  method: string
  paymentResponse?: string
  paidAmount?: number
  currency?: string
  provider?: string
  transactionId: string
  authorizedAmount?: number
}

export interface Total {
  amount: number
  currency: string
}

export interface Line {
  amount: number
  currency: string
  code: string
  name: string
  rate: number
  taxable: number
  sequenceId: number
  inclusive: boolean
}

export interface Tax {
  total: Total
  lines: Line[]
}

export interface Shipping {
  total: Total
  lines: Line[]
}

export interface Shipment {
  trackingNumber?: string
  carrier?: string
  shippedDate: Date
  expectDeliveryOn: string
}

export interface Invoice {
  invoiceNo?: string
  invoiceDocument?: string
}

export interface OrderAddress {
  contactName?: string
  contactPhone?: string
  companyName?: string
  street?: string
  streetNumber?: string
  streetAppendix?: string
  extraLine1?: string
  extraLine2?: string
  extraLine3?: string
  extraLine4?: string
  zipCode?: string
  city?: string
  country?: string
  state?: string
  mixins?: AddressMixins
}

export interface DeliveryWindow {
  id: string
  slotId: string
  deliveryDate: string
  deliveryCycle: string
  deliveryCycleName: string
  deliveryTimeRange: {
    timeFrom: string
    timeTo: string
  }
}

export interface OrderVendor {
  id: string
  name: string
}

export interface TaxAggregate {
  lines: TaxedPrice[]
}

export interface PaymentFee {
  id: string
  type: DiscountType
  name: Localized
  price: TaxedPrice
}

export interface OrderCalculatedPrice {
  price: TaxedPrice
  upliftValue: TaxedPrice
  discountedPrice: TaxedPrice
  paymentFees: PaymentFee[]
  fees: TaxedPrice
  totalFee: DiscountedPrice
  totalDiscount: TotalDiscount
  shipping: TaxedPrice
  totalShipping: DiscountedPrice
  finalPrice: TaxedPrice & { taxAggregate?: TaxAggregate }
}

export interface Order {
  id: string
  quoteId?: string
  cartId?: string
  vendor?: OrderVendor
  masterOrder?: string
  subOrders?: string[]
  createdBy?: string
  channel?: Channel
  created?: string | Date
  completed?: string | Date
  lastStateChange?: string | Date
  shipments?: Shipment[]
  status: OrderStatus
  entries: Entry[]
  discounts?: Discount[]
  customer: OrderCustomer
  siteCode?: string
  countryCode?: string
  billingAddress?: OrderAddress
  shippingAddress?: OrderAddress
  payments?: Payment[]
  shipping?: Shipping
  tax?: Tax
  subTotalPrice?: number
  totalPrice: number
  totalAuthorizedAmount?: number
  currency: string
  deliveryWindowId?: string
  deliveryWindow?: DeliveryWindow
  metadata?: Metadata
  mixins?: OrderMixins
  calculatedPrice?: OrderCalculatedPrice
  legalEntityId?: string
  restriction?: string
}
