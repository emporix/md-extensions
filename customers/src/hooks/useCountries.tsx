import { useCallback, useEffect, useMemo, useState } from 'react'
import { Country } from '../models/Country'
import { useCountriesApi } from '../api/countries'
import { useLocalizedValue } from './useLocalizedValue'
import { Region } from '../models/Region'
import { useTaxesApi } from '../api/taxes'
import { Tax } from '../models/Taxes'
import Localized from '../models/Localized.ts'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const useCountries = () => {
  const { tenant } = useDashboardContext()
  const { getContentLangValue } = useLocalizedValue()
  const { syncAllCountries, syncAllRegions } = useCountriesApi()
  const { getAllTaxesUnpaginated } = useTaxesApi()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const { permissions } = useDashboardContext()
  const canReadTaxes = permissions?.taxes?.viewer

  useEffect(() => {
    ;(async () => {
      const countries = await syncAllCountries()
      setCountries(countries.values)
      const regions = await syncAllRegions()
      setRegions(regions)
      if (canReadTaxes) {
        const allTaxes = await getAllTaxesUnpaginated()
        setTaxes(allTaxes)
      }
    })()
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
