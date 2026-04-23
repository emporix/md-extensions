export interface Site {
  active: boolean
  code: string
  currency: string
  default: boolean
  defaultLanguage: string
  languages: string[]
  name: string
  shipToCountries: string[]
  payment: PaymentMethod[]
  taxDeterminationBasedOn: string
  homeBase: HomeBase
  assistedBuying: AssistedBuying
  cartCalculationScale: number
}

export interface AssistedBuying {
  storefrontUrl: string
}

export interface HomeBase {
  address: {
    city: string
    country: string
    state: string
    street: string
    streetNumber: string
    zipCode: string
  }
  location: {
    latitude: string
    longitude: string
  }
  timezone: string
}

export interface PaymentMethod {
  id: string
  active: boolean
  name: string
  serviceType: string
  serviceUrl: string
}

export enum TaxDeterminationBasedOn {
  BILLING = 'BILLING_ADDRESS',
  SHIPPING = 'SHIPPING_ADDRESS',
}
