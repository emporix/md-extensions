import {
  Price,
  PriceMatch,
  PriceMatchRequest,
  SearchPrice,
} from '../models/Price'
import { api } from './index'
import { useCallback } from 'react'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQueryParams,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export interface PaginatedResponse<Type> {
  values: Type[]
  totalRecords: number
}

export const searchPricesCall = async (
  tenant: string,
  itemIds: string[],
  priceModelId: string | null
) => {
  const requestHeaders = {
    'x-version': 'v2',
  }
  const requestParams = {
    expand: 'priceModel',
  }
  const requestBody = {
    itemIds,
    useFallback: true,
    includesTax: false,
    priceModelId,
  }

  const { data } = await api.post<SearchPrice[]>(
    `price/${tenant}/prices/search`,
    requestBody,
    {
      params: requestParams,
      headers: requestHeaders,
    }
  )
  return data
}

export const getPrices = async (
  tenant: string,
  priceModelId: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Price>> => {
  const { data, headers } = await api.get<Price[]>(`price/${tenant}/prices/`, {
    params: {
      priceModelId,
      ...formatFilterQueryParams(pagination.filters),
      sort: formatPaginationParamsForSorting(pagination),
      ...formatPaginationParamsForEmporixPagination(pagination),
    },
    headers: {
      'x-version': 'v2',
      'X-Total-Count': true,
    },
  })
  return { values: data, totalRecords: +headers['x-total-count'] }
}

export const getPricesForProduct = async (
  tenant: string,
  itemId: string
): Promise<Price[]> => {
  const { data } = await api.get<Price[]>(`price/${tenant}/prices/`, {
    params: {
      itemId,
    },
    headers: {
      'x-version': 'v2',
    },
  })
  return data
}

export const getSinglePrice = async (
  tenant: string,
  priceId: string
): Promise<Price> => {
  const { data } = await api.get<Price>(`price/${tenant}/prices/${priceId}`, {
    headers: {
      'x-version': 'v2',
    },
  })
  return data
}

export const modifyPrice = async (
  tenant: string,
  price: Price
): Promise<boolean> => {
  const priceResponse = await api.put(
    `price/${tenant}/prices/${price.id}`,
    { ...price },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return priceResponse.status === 204
}
export const createPriceCall = async (
  tenant: string,
  price: Price
): Promise<{ id: string }> => {
  const { data } = await api.post<{ id: string }>(
    `price/${tenant}/prices/`,
    { ...price },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

const removePriceCall = async (
  tenant: string,
  priceId: string
): Promise<boolean> => {
  const deleteResponse = await api.delete(`price/${tenant}/prices/${priceId}`, {
    headers: {
      'x-version': 'v2',
    },
  })
  return deleteResponse.status === 204
}

const matchPricesCall = async (
  tenant: string,
  requestData: PriceMatchRequest
): Promise<PriceMatch[]> => {
  const { data } = await api.post<PriceMatch[]>(
    `price/${tenant}/match-prices`,
    requestData,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

export const usePricesApi = () => {
  const { tenant } = useDashboardContext()

  const getPaginatedPrices = useCallback(
    (
      priceModelId: string,
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Price>> => {
      if (tenant) {
        return getPrices(tenant, priceModelId, pagination)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getAllPricesForProduct = useCallback(
    (productId: string) => {
      if (tenant) {
        return getPricesForProduct(tenant, productId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getPrice = useCallback(
    (priceId: string): Promise<Price> => {
      if (tenant && priceId) {
        return getSinglePrice(tenant, priceId)
      } else {
        return Promise.reject('No tenant or price ID provided')
      }
    },
    [tenant]
  )

  const editPrice = useCallback(
    (price: Price) => {
      if (tenant) {
        return modifyPrice(tenant, price)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const searchPrices = useCallback(
    (itemIds: string[], priceModelId: string | null = null) => {
      if (tenant) {
        return searchPricesCall(tenant, itemIds, priceModelId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createPrice = useCallback(
    (price: Price) => {
      if (tenant) {
        return createPriceCall(tenant, price)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const removePrice = useCallback(
    (priceId: string) => {
      if (tenant) {
        return removePriceCall(tenant, priceId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const matchPrices = useCallback(
    (data: PriceMatchRequest) => {
      if (tenant) {
        return matchPricesCall(tenant, data)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return {
    createPrice,
    getPaginatedPrices,
    getAllPricesForProduct,
    getPrice,
    editPrice,
    searchPrices,
    removePrice,
    matchPrices,
  }
}
