import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { useCountriesApi } from './api/countries'
import { useLocalizedValue } from './useLocalizedValue'
import { getApiErrorDetails } from '../helpers/api'
import type { Country } from '../models/Country.model'

type CountryOption = { label: string; value: string }

/** The tenant's countries as the site form offers them (MD `useCountries`). */
export const useCountries = () => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { getContentLangValue } = useLocalizedValue()
  const { syncAllCountries } = useCountriesApi()
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    // A tenant switch drops the previous tenant's countries at once;
    // a response of a superseded load is ignored.
    setCountries([])
    let cancelled = false
    syncAllCountries()
      .then((loaded) => {
        if (!cancelled) setCountries(loaded as Country[])
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          showError(
            t('sites.toasts.errorFetchCountries'),
            getApiErrorDetails(e)
          )
        }
      })
    return () => {
      cancelled = true
    }
    // The toast helpers are not stable; the load depends on the tenant only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncAllCountries])

  const toOption = useMemo(
    () =>
      (country: Country): CountryOption => ({
        label: getContentLangValue(country.name),
        value: country.code,
      }),
    [getContentLangValue]
  )

  /** Every country (home base address). */
  const countryOptions = useMemo(
    () => countries.map(toOption),
    [countries, toOption]
  )

  /** Active countries only (ship-to countries). */
  const activeCountryOptions = useMemo(
    () => countries.filter((country) => country.active).map(toOption),
    [countries, toOption]
  )

  return { countries, countryOptions, activeCountryOptions }
}
