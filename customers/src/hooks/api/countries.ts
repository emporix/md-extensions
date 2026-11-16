import { useCallback } from 'react'
import { Metadata } from '../../models/Metadata.model'
import { PaginationProps } from '../usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  fetchAllCountries,
  fetchAllActiveCountries,
  fetchRegions,
  patchCountry,
} from '@emporix/api-calls'
import { toApiPagination } from '../../helpers/apiPagination'

export const useCountriesApi = () => {
  const { tenant } = useDashboardContext()

  const syncAllRegions = useCallback(() => {
    if (tenant) {
      return fetchRegions(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const syncAllCountriesPaginated = useCallback(
    (paginationParams: Partial<PaginationProps>) => {
      if (tenant) {
        return fetchAllCountries(tenant, toApiPagination(paginationParams))
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const syncAllCountries = useCallback(() => {
    if (tenant) {
      return fetchAllCountries(tenant, { rows: 1000 })
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const syncAllActiveCountries = useCallback(() => {
    if (tenant) {
      return fetchAllActiveCountries(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const toggleCountryActive = useCallback(
    (countryCode: string, active: boolean, metadata: Metadata) => {
      if (tenant) {
        return patchCountry(
          tenant,
          countryCode,
          active,
          metadata as unknown as Parameters<typeof patchCountry>[3]
        )
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return {
    syncAllCountries,
    toggleCountryActive,
    syncAllRegions,
    syncAllActiveCountries,
    syncAllCountriesPaginated,
  }
}
