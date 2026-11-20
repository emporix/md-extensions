import type {
  Country as ApiCountry,
  Tax as ApiTax,
  TaxClass as ApiTaxClass,
  TaxUpdate,
} from '@emporix/api-calls/next'
import type Localized from './Localized.model'

export type Tax = ApiTax
export type TaxClass = ApiTaxClass
export type Country = ApiCountry

/** A country tax record as the list shows it. */
export type TaxRow = Tax & {
  readonly countryCode: string
  readonly countryName?: Localized
}

export type TaxClassFormFields = {
  countryCode: string
  code: string
  rate: number | null
  name: Localized
  description: Localized
}

// MD default of a new tax class: rate 0, nothing else.
export const createTaxClassForm = (
  countryCode = '',
  taxClass?: TaxClass
): TaxClassFormFields => ({
  countryCode,
  code: taxClass?.code ?? '',
  rate: taxClass?.rate ?? 0,
  name: taxClass?.name ?? {},
  description: taxClass?.description ?? {},
})

const hasText = (value: Localized): boolean =>
  Object.values(value).some((entry) => !!entry?.trim())

/**
 * The class to store. `base` is the stored class an edit changes: fields the
 * form does not know (`order`, `isDefault`) stay as they are.
 */
export const toTaxClass = (
  form: TaxClassFormFields,
  base?: TaxClass
): TaxClass => {
  const stored: Partial<TaxClass> = { ...base }
  // A cleared description is removed, not kept from the stored class.
  delete stored.description
  return {
    ...stored,
    code: form.code,
    rate: form.rate ?? 0,
    name: form.name,
    ...(hasText(form.description) ? { description: form.description } : {}),
  }
}

export const toTaxRow = (tax: Tax, countryName?: Localized): TaxRow => ({
  ...tax,
  countryCode: tax.location.countryCode,
  countryName,
})

/** Body of an update: the record's classes replaced, its version sent back. */
export const toTaxUpdate = (tax: Tax, taxClasses: TaxClass[]): TaxUpdate => ({
  location: tax.location,
  taxClasses,
  metadata: { version: tax.metadata?.version },
})
