import { useCallback, useEffect, useMemo, useState } from 'react'
import { Country } from '../models/Country.model'
import { useCountriesApi } from './api/countries'
import { useLocalizedValue } from './useLocalizedValue'
import Localized from '../models/Localized.model'
import { Region } from '../models/Region.model'
import { useTaxesApi } from './api/taxes'
import { Tax } from '../models/Taxes.model'
import { usePermissions } from '../context/PermissionsProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'

export const useCountries = () => {
  const { tenant } = useDashboardContext()
  const { getContentLangValue } = useLocalizedValue()
  const { syncAllCountries, syncAllRegions } = useCountriesApi()
  const { getAllTaxesUnpaginated } = useTaxesApi()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const { hasPermission } = usePermissions()
  const canReadTaxes = hasPermission(EmployeeDomains.TAXES_VIEWER)

  useEffect(() => {
    ;(async () => {
      const countries = await syncAllCountries()
      setCountries(countries.values as unknown as Country[])
      const regions = await syncAllRegions()
      setRegions(regions)
      if (canReadTaxes) {
        const allTaxes = await getAllTaxesUnpaginated()
        setTaxes(allTaxes)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity (reload per tenant)
  }, [tenant])

  const activeCountries = useMemo(() => {
    return countries.filter((country) => country.active)
  }, [countries])

  const countriesWithTax = useMemo(() => {
    return taxes.map((country) => country.locationCode)
  }, [taxes])

  const countriesDropdownOptions = useMemo(() => {
    return countries.map((country: Country) => ({
      label: `${country.code} - ${getContentLangValue(country.name)}`,
      value: country.code,
    }))
  }, [getContentLangValue, countries])

  const activeCountriesDropdownOptions = useMemo(() => {
    return activeCountries.map((country: Country) => ({
      label: `${country.code} - ${getContentLangValue(country.name)}`,
      value: country.code,
    }))
  }, [getContentLangValue, activeCountries])

  const getCountryLocalizedName = useCallback(
    (countryCode: string): Localized | undefined => {
      return countries.find((country) => country.code === countryCode)?.name
    },
    [countries]
  )

  const regionsDropdownOptions = useMemo(() => {
    return regions.map((region: Region) => ({
      label: `${getContentLangValue(region.name)}`,
      value: region.code,
    }))
  }, [getContentLangValue, regions])

  const getRegionLocalizedName = useCallback(
    (regionCode: string): Localized | undefined => {
      return regions.find((region) => region.code === regionCode)?.name
    },
    [regions]
  )

  return {
    countries,
    activeCountries,
    countriesWithTax,
    countriesDropdownOptions,
    activeCountriesDropdownOptions,
    getCountryLocalizedName,
    regions,
    regionsDropdownOptions,
    getRegionLocalizedName,
  }
}
