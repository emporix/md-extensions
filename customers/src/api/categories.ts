/**
 * Minimal categories API for mixin classification UI (useMixinsForm.getAllCategories).
 */
import { useCallback } from 'react'
import { api } from '.'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { PaginationProps } from '../hooks/usePagination'
import { Category, CategoryType } from '../models/Category'
import { DataTableFilterMeta } from 'primereact/datatable'
import { PaginatedResponse } from './orders'
import { useTenant } from '../context/TenantProvider'
import { fetchAllRecords } from '../helpers/paginationUtils'

export const fetchCategory = async (tenant: string, id: string) => {
  const response = await api.get<Category>(
    `/category/${tenant}/categories/${id}`,
    {
      params: { showUnpublished: true },
      headers: { 'x-version': 'v2' },
    }
  )
  return response.data
}

export const getCategories = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  type?: CategoryType,
  showRoots?: boolean,
  showUnpublished?: boolean
): Promise<PaginatedResponse<Category>> => {
  const filters: DataTableFilterMeta = {
    ...pagination.filters,
  }
  const params: Record<string, unknown> = {
    sort: formatPaginationParamsForSorting(pagination),
    ...formatPaginationParamsForEmporixPagination(pagination),
    q: formatFilterQuery(filters),
  }
  if (type) {
    params.q = params.q ? `${params.q} type:${type}` : `type:${type}`
  }
  if (showRoots) {
    params.showRoots = showRoots
  }
  if (showUnpublished) {
    params.showUnpublished = showUnpublished
  }
  const { data, headers } = await api.get<Category[]>(
    `/category/${tenant}/categories/`,
    {
      params,
      headers: {
        'x-version': 'v2',
        'X-Total-Count': true,
      },
    }
  )
  return { values: data, totalRecords: parseInt(headers['x-total-count']) }
}

export const useCategoriesApi = () => {
  const { tenant } = useTenant()

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
          paginationParams,
          type,
          showRoots,
          showUnpublished
        )
      }
      return Promise.reject('no tenant')
    },
    [tenant]
  )

  const getCategory = useCallback(
    (id: string): Promise<Category> => {
      if (tenant) {
        return fetchCategory(tenant, id)
      }
      return Promise.reject('No tenant provided')
    },
    [tenant]
  )

  const getAllCategories = useCallback(
    async (
      initialPagination: Partial<PaginationProps> = {
        currentPage: 1,
        rows: 100,
      },
      type?: CategoryType,
      showRoots?: boolean,
      showUnpublished?: boolean
    ): Promise<Category[]> => {
      const fetchPage = async (pagination: Partial<PaginationProps>) => {
        if (!tenant) {
          throw new Error('No tenant provided')
        }
        return getCategories(tenant, pagination, type, showRoots, showUnpublished)
      }
      return fetchAllRecords(fetchPage, initialPagination)
    },
    [tenant]
  )

  return { getAllCategories, getCategoriesPaginated, getCategory }
}
