import Localized from './Localized.ts'
import { Metadata } from './Metadata.ts'

export interface TaxClass {
  code: string
  name?: Localized
  description?: Localized
  order?: number
  rate: number
  location?: { code?: string; name?: string }
}

export interface Tax {
  location: { countryCode: string }
  locationCode: string
  taxClasses: TaxClass[]
  metadata?: Metadata
}

export interface TaxWithLocationName extends Tax {
  locationName?: Localized
}
