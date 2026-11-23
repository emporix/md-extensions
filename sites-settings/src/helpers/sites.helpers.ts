import {
  PaymentMethod,
  Site,
  SiteCreate,
  TaxDeterminationBasedOn,
} from '../models/Site.model'

/** Default decimal digits of the cart calculation (API default). */
export const DEFAULT_CART_CALCULATION_SCALE = 2

export interface SiteFormFields {
  active: boolean
  default: boolean
  name: string
  code: string
  shipToCountries: string[]
  currency: string
  languages: string[]
  defaultLanguage: string
  payment: PaymentMethod[]
  storefrontUrl: string
  city: string
  country: string
  state: string
  street: string
  streetNumber: string
  zipCode: string
  longitude?: number
  latitude?: number
  taxDeterminationBasedOn: string
  cartCalculationScale: number
  availableCurrencies: string[]
  timezone: string
}

export const createForm = (): SiteFormFields => ({
  active: true,
  default: false,
  name: '',
  code: '',
  shipToCountries: [],
  currency: '',
  languages: [],
  defaultLanguage: '',
  payment: [],
  storefrontUrl: '',
  city: '',
  country: '',
  state: '',
  street: '',
  streetNumber: '',
  zipCode: '',
  longitude: undefined,
  latitude: undefined,
  taxDeterminationBasedOn: TaxDeterminationBasedOn.BILLING,
  cartCalculationScale: DEFAULT_CART_CALCULATION_SCALE,
  availableCurrencies: [],
  timezone: '',
})

export const mapToForm = (site: Site): SiteFormFields => ({
  active: site.active ?? false,
  default: site.default || false,
  name: site.name || '',
  code: site.code || '',
  shipToCountries: site.shipToCountries || [],
  currency: site.currency || '',
  languages: site.languages || [],
  defaultLanguage: site.defaultLanguage || '',
  payment: site.payment || [],
  taxDeterminationBasedOn:
    site.taxDeterminationBasedOn || TaxDeterminationBasedOn.BILLING,
  storefrontUrl: site.assistedBuying?.storefrontUrl || '',
  city: site.homeBase?.address?.city || '',
  country: site.homeBase?.address?.country || '',
  state: site.homeBase?.address?.state || '',
  street: site.homeBase?.address?.street || '',
  streetNumber: site.homeBase?.address?.streetNumber || '',
  zipCode: site.homeBase?.address?.zipCode || '',
  longitude: site.homeBase?.location?.longitude,
  latitude: site.homeBase?.location?.latitude,
  cartCalculationScale:
    site.cartCalculationScale ?? DEFAULT_CART_CALCULATION_SCALE,
  availableCurrencies: site.availableCurrencies || [],
  timezone: site.homeBase?.timezone || '',
})

export const mapToPayload = (form: SiteFormFields): SiteCreate => ({
  active: form.active,
  default: form.default,
  name: form.name,
  code: form.code,
  shipToCountries: form.shipToCountries,
  currency: form.currency,
  languages: form.languages,
  defaultLanguage: form.defaultLanguage,
  payment: form.payment,
  taxDeterminationBasedOn:
    form.taxDeterminationBasedOn as SiteCreate['taxDeterminationBasedOn'],
  assistedBuying: {
    storefrontUrl: form.storefrontUrl,
  },
  homeBase: {
    address: {
      city: form.city,
      country: form.country,
      state: form.state,
      street: form.street,
      streetNumber: form.streetNumber,
      zipCode: form.zipCode,
    },
    location: {
      latitude: form.latitude,
      longitude: form.longitude,
    },
    timezone: form.timezone,
  },
  cartCalculationScale: form.cartCalculationScale,
  availableCurrencies: form.availableCurrencies,
})

/**
 * The PUT body of an edit: the loaded site (mixins, metadata and every field
 * the form does not show) with the form fields on top, as MD sent it.
 */
export const mapToUpdatePayload = (
  site: Site | undefined,
  form: SiteFormFields
) => ({ ...site, ...mapToPayload(form) })

/** MD: Decimal digits must be an integer ≥ 0; an empty field is allowed. */
export const isValidCartCalculationScale = (value: unknown): boolean => {
  if (value === undefined || value === null) return true
  const numValue = Number(value)
  return Number.isInteger(numValue) && numValue >= 0
}

/** MD: an empty or negative input becomes 2 or 0. */
export const parseCartCalculationScale = (input: string): number => {
  const value = input ? parseInt(input, 10) : DEFAULT_CART_CALCULATION_SCALE
  if (Number.isNaN(value)) return DEFAULT_CART_CALCULATION_SCALE
  return value < 0 ? 0 : value
}

/** The default language stays only while it is one of the site languages. */
export const keepDefaultLanguage = (
  languages: string[],
  defaultLanguage: string
): string => (languages.includes(defaultLanguage) ? defaultLanguage : '')

/**
 * Selected payment ids → site payment entries. Entries whose payment mode is
 * not offered (any more) stay, as MD's multi-select kept them.
 */
export const toSitePayments = (
  selectedIds: string[],
  current: PaymentMethod[],
  offered: PaymentMethod[]
): PaymentMethod[] => {
  const offeredIds = new Set(offered.map((p) => p.id))
  const kept = current.filter((p) => !offeredIds.has(p.id))
  const picked = offered.filter((p) => p.id && selectedIds.includes(p.id))
  return [...kept, ...picked]
}
