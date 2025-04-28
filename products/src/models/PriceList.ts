import Localized from './Localized'
import { Group } from './Groups'
import { Currency } from './Currency'
import { Region } from './Region'
import { Country } from './Country'
import { Price, PriceItem, PriceTierValue } from './Price'
import { PriceModel } from './PriceModel'
import { Mixins } from './Mixins'
import { Metadata } from './Metadata'

export interface PriceList {
  id?: string
  name: Localized
  currency: string
  countries: string[]
  regions: string[]
  customerGroups: string[]
  siteCode: string
  validity: {
    from?: string
    to?: string
  }
  metadata?: Metadata
  mixins?: Mixins
}

export interface SettingsFormOptions {
  customerGroups: Group[]
  currencies: Currency[]
  regions: Region[]
  countries: Country[]
}

export interface PaginatedPriceLists {
  data: PriceList[]
  totalRecords: number
}

export interface AssignedPrice {
  id: string
  itemId: PriceItem
  priceModelId: string
  tierValues: PriceTierValue[]
  metadata?: {
    createdAt?: string
    modifiedAt?: string
    version?: number
  }
}

export interface PaginatedAssignedPrices {
  data: AssignedPrice[]
  totalRecords: number
}

export interface PricesTableItem extends AssignedPrice {
  catalogPrices: Price[]
  priceModel: PriceModel
  catalogTierValues: PriceTierValue[]
  isNewItem: boolean
}

export interface MultiplePricesResponse {
  index: number
  id: string
  code: number
  status: string
}

export interface RowExtensionData {
  catalogValue: string
  saleValue: string
  quantity: number
  index: number
}
