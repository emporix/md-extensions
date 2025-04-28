import { api } from './index'
import { Country } from '../models/Country'
import { Region } from '../models/Region'
import { useCallback } from 'react'
import { PaginationProps } from '../hooks/usePagination'
import { PaginatedResponse } from './priceModels'
import { formatFilterQueryParams } from '../helpers/params'
import { Metadata } from '../models/Metadata.ts'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const fetchAllCountries = async (
  tenant: string,
  paginationParams: Partial<PaginationProps>
): Promise<PaginatedResponse<Country>> => {
  const { data, headers } = await api.get<Country[]>(
    `country/${tenant}/countries`,
    {
      params: {
        pageSize: paginationParams?.rows,
        pageNumber: paginationParams?.currentPage || 1,
        sort: 'code:asc',
        ...formatFilterQueryParams(paginationParams.filters),
      },
      headers: {
        'X-Version': 'v2',
        'X-Total-Count': true,
      },
    }
  )

  return { values: data, totalRecords: +headers['x-total-count'] }
}

export const fetchAllActiveCountries = async (
  tenant: string
): Promise<Country[]> => {
  const params = {
    active: true,
    pageSize: '1000',
    sort: 'code:asc',
  }
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<Country[]>(`country/${tenant}/countries`, {
    params,
    headers,
  })

  return data
}

export const fetchRegions = async (tenant: string): Promise<Region[]> => {
  const params = {
    pageSize: '1000',
    sort: 'name,code:desc',
  }
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<Region[]>(`country/${tenant}/regions`, {
    params,
    headers,
  })

  return data
}

export const patchCountry = async (
  tenant: string,
  countryCode: string,
  active: boolean,
  metadata: Metadata
) => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.patch<unknown>(
    `country/${tenant}/countries/${countryCode}`,
    {
      active,
      metadata: { ...metadata, version: metadata.version },
    },
    {
      headers,
    }
  )

  return data
}

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
        return fetchAllCountries(tenant, paginationParams)
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
        return patchCountry(tenant, countryCode, active, metadata)
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
