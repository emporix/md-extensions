import Localized from './Localized'

export enum TierType {
  BASIC = 'BASIC',
  VOLUME = 'VOLUME',
  TIERED = 'TIERED',
}

interface MinQuantity {
  quantity: number
  unitCode: string
}

export interface PriceModelTier {
  id?: string
  minQuantity: MinQuantity
}

interface TierDefinition {
  tierType: TierType
  tiers: PriceModelTier[]
}

export interface PriceModel {
  id?: string
  includesTax?: boolean
  includesMarkup?: boolean
  name?: Localized
  description?: Localized
  tierDefinition: TierDefinition
  measurementUnit: MinQuantity
  default: boolean
  metadata?: {
    version: number
    createdAt: string
    modifiedAt: string
  }
}
