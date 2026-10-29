/** Price/tax value shapes shared with MD `models/Quotes` (only what Price uses). */
export interface Prices {
  netValue: number
  grossValue: number
  taxValue: number
}

export interface Tax {
  taxClass: string
  taxRate: number
  prices?: Prices
}

export interface TierValue {
  id: string
  priceValue: number
}
