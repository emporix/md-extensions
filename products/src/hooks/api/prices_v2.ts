import { Price, PriceMatchRequest } from '../../models/Price.model'
import { useCallback } from 'react'
import { PaginationProps } from '../usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  createPriceV2Call,
  getPrices,
  getPricesForProduct,
  getSinglePrice,
  matchPricesCall,
  modifyPrice,
  removePriceCall,
  searchPricesCall,
  type PaginatedResponse,
} from '@emporix/api-calls'
import { toApiPagination } from '../../helpers/apiPagination'

export const usePricesApi = () => {
  const { tenant } = useDashboardContext()

  const getPaginatedPrices = useCallback(
    (
      priceModelId: string,
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Price>> => {
      if (tenant) {
        return getPrices(tenant, priceModelId, toApiPagination(pagination))
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
        return createPriceV2Call(tenant, price)
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
