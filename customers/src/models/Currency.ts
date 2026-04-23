import Localized from './Localized'
import { Metadata } from './Metadata.ts'

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
