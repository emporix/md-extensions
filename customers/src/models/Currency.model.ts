import { Metadata } from './Metadata.model'
import Localized from './Localized.model'

export interface CurrencyExchange {
  code: string
  sourceCurrency: string
  targetCurrency: string
  rate: number
  metadata: Metadata
}

export interface Currency {
  code: string
  name: Localized
}
