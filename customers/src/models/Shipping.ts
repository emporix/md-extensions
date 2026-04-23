import Localized from './Localized'
import { TaxClass } from './Taxes'
import { Metadata } from './Metadata'

export enum Weekdays {
  sunday = 'SUNDAY',
  monday = 'MONDAY',
  tuesday = 'TUESDAY',
  wednesday = 'WEDNESDAY',
  thursday = 'THURSDAY',
  friday = 'FRIDAY',
  saturday = 'SATURDAY',
}

export enum ShippingEditOp {
  add = 'ADD',
  remove = 'REMOVE',
  replace = 'REPLACE',
}

export interface ShippingPatchOp {
  op: ShippingEditOp
  path: string
  value: unknown
}

export interface DeliveryTime {
  id: string
  name: string
  siteCode: string
  isDeliveryDay: boolean
  zoneId: string
  deliveryDayShift: number
  day: Partial<DeliveryDay>
  slots: Slot[]
  metadata: Metadata
  isForAllZones: boolean
  timeZoneId: string
}

export interface DeliveryDay {
  weekday: string
  singleDate: string
  datePeriod: {
    dateFrom: string
    dateTo: string
  }
}

export interface Slot {
  id: string
  shippingMethod: string
  deliveryTimeRange: {
    timeFrom: string
    timeTo: string
  }
  cutOffTime: {
    time: string
    cutOffDayShift: number
    deliveryCycleName: string
  }
  capacity: number
}

export interface ShipTo {
  country: string
  postalCode?: string
}

export interface Zone {
  id: string
  default?: boolean
  name: Localized
  shipTo: ShipTo[]
  methods?: ShippingMethod[]
}

export interface ShippingMethod {
  id: string
  name: Localized
  fees: Fee[]
  active: boolean
  maxOrderValue: MaxOrderValue
  shippingTaxCode?: string
  taxClass?: TaxClass
  zoneId?: string
}

export interface Fee {
  minOrderValue: MinOrderValue
  cost: Cost
}

export interface MaxOrderValue {
  amount: number
  currency: string
}

export interface MinOrderValue {
  amount: number
  currency: string
}

export interface Cost {
  amount: number
  currency: string
}

export interface BulkCreationResponse {
  index: number
  id: string
  code: number
  errorCodes: string[]
  status: string
}
