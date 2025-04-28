import Localized from './Localized'
import { PriceModel } from './PriceModel'
import { Metadata } from './Metadata'
import { Tax } from './Taxes.ts'

interface MeasurementUnit {
  quantity: number
  unitCode: string
}

interface PriceEntry {
  effectiveAmount: number
  measurementUnit: MeasurementUnit
}

export type ItemType = 'PRODUCT' | 'SKU'

export interface PriceV2 {
  itemId: {
    id: string
    itemType: ItemType
  }
  itemYrn?: string
  currency: string
  location: {
    countryCode: string
  }
  salePrice?: {
    discountAmount?: number
    discountRate?: number
    description?: string
  }
  restrictions: PriceRestrictions
}

export interface ProductPrice {
  priceId: string
  productId: string
  yrn: string
  siteCode: string
  totalPrice: number
  currency: string
  originalAmount: number
  effectiveAmount?: number
  basePrice: PriceEntry
  presentationPrice: PriceEntry
  metadata: {
    createdAt: string
    modifiedAt: string
    version: number
  }
}

export interface PriceItem {
  id: string
  itemType: 'PRODUCT' | 'SKU'
  name?: Localized
}

interface Principal {
  id: string
  type: 'CUSTOMER' | 'GROUP'
}

interface PriceRestrictions {
  principals?: Principal[]
  validity?: {
    from?: string
    to?: string
  }
  siteCodes: string[]
  priceListId?: string
}

export interface PriceTierValue {
  id?: string
  priceValue: string
}

interface Mixins {
  [key: string]: any
}

interface PriceMetadata {
  version: number
  createdAt: string
  modifiedAt: string
  mixins: Mixins
}

export interface Price {
  id?: string
  itemId: PriceItem
  itemYrn?: string
  currency: string
  location: {
    countryCode: string
  }
  salePrice?: {
    discountAmount?: number
    discountRate?: number
    description?: string
  }
  priceModelId?: string
  restrictions?: PriceRestrictions
  tierValues: PriceTierValue[]
  mixins?: Mixins
  metadata?: PriceMetadata
  priceModel?: PriceModel
}

export interface SearchPrice {
  itemId: string
  prices: Price[]
}

export interface PriceWithFlatPrices extends Price {
  itemName?: string

  // workaround for primereact rowEdit to have dynamic columns fields on the top level of the object
  [key: string]: any
}

export interface PriceMatchRequest {
  targetCurrency: string
  siteCode: string
  targetLocation: {
    countryCode: string
  }
  items: {
    itemId: {
      itemType: ItemType
      id: string
    }
    quantity: {
      quantity: number
      unitCode?: string
    }
  }[]
}

export interface PriceMatch {
  priceId: string
  itemId: {
    itemType: ItemType
    id: string
  }
  site: {
    code: string
  }
  currency: string
  location: {
    countryCode: string
  }
  originalValue: number
  effectiveValue: number
  totalValue: number
  quantity: {
    quantity: number
    unitCode: string
  }
  includesTax: boolean
  priceModel: PriceModel
  tax: Tax
  tierValues: PriceTierValue[]
  metadata: Metadata
}
