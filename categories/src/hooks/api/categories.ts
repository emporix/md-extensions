import { useCallback } from 'react'
import {
  createNewCategory,
  deleteSingleCategory,
  fetchCategory,
  getCategories,
  getCategoryParentsCall,
  getSubcategoriesCall,
  modifyCategory,
  patchCategoryCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { Category, CategoryType } from '../../models/Category.model'
import { useDashboardContext } from '../../context/Dashboard.context'

const NO_TENANT = 'No tenant provided'

/**
 * Ported from management-dashboard `hooks/api/categories.ts` (product
 * assignment calls dropped: nothing in this remote assigns products). The
 * tenant comes from the host `appState` instead of MD's `useTenant()`.
 */
export const useCategoriesApi = () => {
  const { tenant } = useDashboardContext()

  const getAllCategories = useCallback(
    async (
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
          throw new Error(NO_TENANT)
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
    },
    [tenant]
  )

  const getSubCategories = useCallback(
    async (id: string, depth = 1) => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return getSubcategoriesCall(tenant, id, depth)
    },
    [tenant]
  )

  const getCategory = useCallback(
    (id: string): Promise<Category> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return fetchCategory(tenant, id) as Promise<Category>
    },
    [tenant]
  )

  const updateCategory = useCallback(
    (category: Partial<Category>): Promise<unknown> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return modifyCategory(tenant, category)
    },
    [tenant]
  )

  const patchCategory = useCallback(
    (category: Partial<Category>): Promise<unknown> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return patchCategoryCall(tenant, category)
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
      if (!tenant) return Promise.reject(NO_TENANT)
      return getCategories(
        tenant,
        toApiPagination(paginationParams),
        type,
        showRoots,
        showUnpublished
      ) as Promise<{ values: Category[]; totalRecords: number }>
    },
    [tenant]
  )

  const createCategory = useCallback(
    (categoryData: Partial<Category>): Promise<string> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return createNewCategory(tenant, categoryData)
    },
    [tenant]
  )

  const deleteCategory = useCallback(
    (categoryId: string, withSubcategories = true) => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return deleteSingleCategory(tenant, categoryId, withSubcategories)
    },
    [tenant]
  )

  const getCategoryParents = useCallback(
    (categoryId: string) => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return getCategoryParentsCall(tenant, categoryId)
    },
    [tenant]
  )

  return {
    getCategory,
    getCategoriesPaginated,
    getAllCategories,
    getSubCategories,
    updateCategory,
    patchCategory,
    createCategory,
    deleteCategory,
    getCategoryParents,
  }
}
