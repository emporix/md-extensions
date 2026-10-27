import Localized from './Localized.model'

export interface Unit {
  code: string
  name: Localized
  type: string
  symbol?: string
  baseUnit: boolean
  factor: number
  metadata?: {
    version: number
  }
}
