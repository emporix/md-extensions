import { EntityAddress } from './LegalEntity'
import Localized from './Localized'
import { ProductType } from './Category'

export enum OrderStatus {
  IN_CHECKOUT = 'IN_CHECKOUT',
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
}

export enum OrderStatusColor {
  IN_CHECKOUT = '#6C9192',
  CREATED = '#E6C20B',
  CONFIRMED = '#2B95EC',
  DECLINED = '#FD594D',
  SHIPPED = '#4543A4',
  COMPLETED = '#1CAB2F',
}

export interface Mixins {
  [key: string]: any
}

export interface Options {
  [key: string]: any
}

export interface Metadata {
  [key: string]: any
}

export interface AdditionalCode {
  code: string
}

export interface Channel {
  name: string
  source: string
}

export interface Image {
  id: string
  url: string
}

export interface Color {
  red: number
  green: number
  blue: number
}

export interface OrderProduct {
  description: string
  name: string
  sku: string
  published: boolean
  images: Image[]
  metadata: Metadata
  localizedName: Localized
  mixins: Mixins
  id: string
  productType: ProductType
  bundledProducts?: BundleProduct[]
}

export interface BundleProduct {
  productId: string
  amount: number
}

export interface Image {
  id: string
  url: string
}

export interface Variant {
  id: string
  name: string
  code: string
  images: Image[]
  options: Options
  mixins: Mixins
}

export interface Entry {
  id: string
  amount: number
  orderedAmount: number
  originalAmount: number
  originalPrice: number
  unitPrice: number
  totalPrice: number
  authorizedAmount?: number
  link: string
  product: OrderProduct
  variant?: Variant
  metadata: Metadata
  mixins: Mixins
}

export interface Link {
  id: string
  type: string
  url: string
}

export interface Discount {
  code: string
  name: string
  amount: number
  currency: string
  discountRate: number
  sequenceId: number
  link: Link
}

export interface Customer {
  id: string
  title: string
  name: string
  firstName: string
  lastName: string
  email: string
  company: string
  metadata: Metadata
  mixins: Mixins
}

export interface Payment {
  status: string
  method: string
  paymentResponse: string
  paidAmount: number
  currency: string
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
  invoiceNo: string
  invoiceDocument?: string
}

export interface Order {
  id: string
  metadata: Metadata
  mixins: Mixins
  created: Date
  completed: Date
  status: OrderStatus
  siteCode: string
  countryCode: string
  deliveryWindowId: string
  orderCycle: string
  channel: Channel
  entries: Entry[]
  discounts: Discount[]
  customer: Customer
  billingAddress: EntityAddress
  shippingAddress: EntityAddress
  subTotalPrice: number
  totalPrice: number
  totalAuthorizedAmount: number
  currency: string
  payments: Payment[]
  tax: Tax
  shipping: Shipping
  shipments: Shipment[]
  quoteId?: string
}
