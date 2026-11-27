import { useEffect, useState } from 'react'
import { useTaxesApi } from './api/taxes'
import { TaxClass } from '../models/Taxes.model'

export interface QuoteTaxClasses {
  readonly taxClasses: TaxClass[]
  /** true when the classes could not be read (for example a missing scope). */
  readonly loadFailed: boolean
  /** true once the classes of the country were read successfully. */
  readonly loaded: boolean
}

/**
 * Tax classes of the country of the quote's shipping address, from the tax
 * service (COP-7125, MD `useQuoteTaxClasses` of
 * emporix/management-dashboard#1707). Without a country nothing is loaded:
 * before an address only net values are entered, and with `enabled` false (no
 * row needs a class) the tax service is not called at all. A failed load never
 * throws; it is reported through `loadFailed` so the Preview can tell the
 * employee.
 */
export const useQuoteTaxClasses = (
  countryCode?: string,
  enabled = true
): QuoteTaxClasses => {
  const { getTax } = useTaxesApi()
  const [state, setState] = useState<QuoteTaxClasses>({
    taxClasses: [],
    loadFailed: false,
    loaded: false,
  })

  useEffect(() => {
    // Never keep the classes (or `loaded`) of a previous country.
    setState({ taxClasses: [], loadFailed: false, loaded: false })
    if (!countryCode || !enabled) return
    let cancelled = false
    getTax(countryCode)
      .then((tax) => {
        if (!cancelled)
          setState({
            taxClasses: tax?.taxClasses ?? [],
            loadFailed: false,
            loaded: true,
          })
      })
      .catch((e: unknown) => {
        console.error(e)
        if (!cancelled)
          setState({ taxClasses: [], loadFailed: true, loaded: false })
      })
    return () => {
      cancelled = true
    }
    // Keyed by the country only; `getTax` changes with the tenant, which
    // cannot change while a quote is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [countryCode, enabled])

  return state
}
