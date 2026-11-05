import { useCallback } from 'react'
import {
  CategoryType,
  fetchCategory,
  getCategories,
  getCategoryTreesCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { Category } from '../../models/Category.model'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useCategoriesApi = () => {
  const { tenant } = useDashboardContext()

  const getCategoryTrees = useCallback(async () => {
    if (!tenant) return Promise.reject(new Error('No tenant'))
    return getCategoryTreesCall(tenant, {
      showUnpublished: true,
      type: CategoryType.STANDARD,
    })
  }, [tenant])

  const getAllCategories = async (
    initialPagination: Partial<PaginationProps> = apiPagination({
      currentPage: 1,
      rows: 100,
    }),
    type?: CategoryType,
    showRoots?: boolean,
    showUnpublished?: boolean
  ): Promise<Category[]> => {
    const fetchPage = async (pagination: Partial<PaginationProps>) => {
      if (!tenant) {
        throw new Error('No tenant provided')
      }
      return getCategories(
        tenant,
        toApiPagination(pagination),
        type,
        showRoots,
        showUnpublished
      )
    }
    return fetchAllRecords(fetchPage, initialPagination)
  }

  const getCategory = useCallback(
    (id: string): Promise<Category> => {
      if (tenant) {
        return fetchCategory(tenant, id)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getCategoriesPaginated = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      type?: CategoryType,
      showRoots?: boolean,
      showUnpublished?: boolean
    ) => {
      if (tenant) {
        return getCategories(
          tenant,
          toApiPagination(paginationParams),
          type,
          showRoots,
          showUnpublished
        )
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  return {
    getCategoryTrees,
    getAllCategories,
    getCategory,
    getCategoriesPaginated,
  }
}
