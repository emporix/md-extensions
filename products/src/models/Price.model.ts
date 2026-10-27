import Localized from './Localized.model'
import { PriceModel } from './PriceModel.model'
import { Tax, TierValue } from './Quotes.model'
import { Metadata } from './Metadata.model'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD parity (free-form mixin values)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD parity
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
  tierValues: TierValue[]
  metadata: Metadata
}
