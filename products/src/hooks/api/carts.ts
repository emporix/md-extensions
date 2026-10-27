import { useCallback } from 'react'
import { getCartByIdCall, searchCartsCall } from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { Cart } from '../../models/Cart.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/carts` — only the calls the mixins reference selector uses. */
export const useCartsApi = () => {
  const { tenant } = useDashboardContext()

  const searchCarts = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      siteCode?: string
    ): Promise<{ carts: Cart[]; totalRecords: number }> => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      const params = siteCode ? { siteCode } : undefined
      return searchCartsCall(tenant, toApiPagination(paginationParams), params)
    },
    [tenant]
  )

  const getCartById = useCallback(
    (id: string): Promise<Cart> => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getCartByIdCall(tenant, id)
    },
    [tenant]
  )

  const getAllCarts = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<Cart[]> => {
      const fetchPage = async (p: Partial<PaginationProps>) => {
        const { carts, totalRecords } = await searchCarts(p)
        return { values: carts, totalRecords }
      }
      return fetchAllRecords(fetchPage, {
        currentPage: 1,
        rows: 100,
        ...pagination,
      })
    },
    [searchCarts]
  )

  return { searchCarts, getAllCarts, getCartById }
}
