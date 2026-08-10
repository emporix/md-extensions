import { Metadata } from './Metadata.model'
import { Mixins } from './Mixins.model'
import { Entry, TaxedPrice } from './Order.model'

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  REVIEWED = 'REVIEWED',
}

export enum ReturnStatusColor {
  PENDING = '#6C9192',
  APPROVED = '#42a64e',
  REJECTED = '#E8615A',
  CLOSED = '#C98921',
  // MD used var(--blue-5) (#3b73bb); the CL token holds the same value.
  REVIEWED = 'var(--color-primary)',
}

export interface Reason {
  code?: string
  details?: string
}

export interface Requestor {
  customerId: string
  firstName: string
  lastName: string
  email: string
}

export interface ReturnUpdateRequest {
  op: string
  path: string
  value: unknown
}

export enum ReturnEditOp {
  add = 'ADD',
  remove = 'REMOVE',
  replace = 'REPLACE',
}

export interface Return {
  id: string
  approvalStatus: ReturnStatus
  expiryDate: string
  requestor: Requestor
  metadata: Metadata
}

export interface Submitter {
  userType: string
  firstName: string
  lastName: string
  email: string
}

export interface Price {
  value: number
  currency: string
}

export interface ReturnEntry extends Entry {
  reason: Reason
  quantity: number
}

export interface ReturnOrder {
  id: string
  items: ReturnOrderItem[]
}

export interface ReturnOrderItem {
  id: string
  name: string
  quantity: number
  reason?: Reason
  total: Price
  unitPrice: Price
  calculatedUnitPrice?: TaxedPrice
  calculatedPrice?: { finalPrice: TaxedPrice }
}

export interface ReturnDetails {
  id: string
  reason: Reason
  approvalStatus: ReturnStatus
  requestor: Requestor
  submitter: Submitter
  received: boolean
  metadata: Metadata
  total?: Price
  calculatedPrice?: { finalPrice: TaxedPrice }
  orders: ReturnOrder[]
  expiryDate: string
  mixins: Mixins
}

export interface ReturnForm {
  submitter: {
    firstName?: string
    lastName?: string
    email?: string
  }
  requestor: {
    customerId: string
    email: string
    anonymous?: boolean
  }
  reason: {
    code: string
    details: string
  }
  orders: ReturnOrder[]
}
