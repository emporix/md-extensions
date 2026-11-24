import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { useCountriesApi } from './api/countries'
import { useLocalizedValue } from './useLocalizedValue'
import { getApiErrorDetails } from '../helpers/api'
import type Localized from '../models/Localized.model'
import type { Country } from '../models/Tax.model'

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
        if (!cancelled) setCountries(loaded)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          showError(t('taxes.toast.errorFetchCountries'), getApiErrorDetails(e))
        }
      })
    return () => {
      cancelled = true
    }
    // The toast helpers are not stable; the load depends on the tenant only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncAllCountries])

  const activeCountriesDropdownOptions = useMemo(
    () =>
      countries
        .filter((country) => country.active)
        .map((country) => ({
          label: `${country.code} - ${getContentLangValue(country.name)}`,
          value: country.code,
        })),
    [getContentLangValue, countries]
  )

  const getCountryLocalizedName = useCallback(
    (countryCode: string): Localized | undefined =>
      // Only an active country has a name; an inactive one shows as such.
      countries.find(
        (country) => country.code === countryCode && country.active
      )?.name,
    [countries]
  )

  return {
    countries,
    activeCountriesDropdownOptions,
    getCountryLocalizedName,
  }
}
