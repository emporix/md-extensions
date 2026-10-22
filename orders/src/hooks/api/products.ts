import { useCallback } from 'react'
import { fetchPaginatedProduct, fetchProductCall } from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import type { Product } from '../../models/Product.model'

export const useProductsApi = () => {
  const { tenant } = useDashboardContext()

  const syncPaginatedProducts = useCallback(
    async (
      paginationParams: Partial<PaginationProps>,
      withTotalCount = true
    ): Promise<{ data: Product[]; totalCount: number }> => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      const { values, totalRecords } = await fetchPaginatedProduct(
        tenant,
        toApiPagination(paginationParams),
        withTotalCount
      )
      return {
        data: values as unknown as Product[],
        totalCount: totalRecords,
      }
    },
    [tenant]
  )

  const getProduct = useCallback(
    async (productId: string): Promise<Product> => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      const product = (await fetchProductCall(
        tenant,
        productId
      )) as unknown as Product
      return { ...product, name: product.name ?? {} }
    },
    [tenant]
  )

  return { syncPaginatedProducts, getProduct }
}
