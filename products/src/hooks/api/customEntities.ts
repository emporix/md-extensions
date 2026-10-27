import { useCallback } from 'react'
import { getCustomEntitiesCall } from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { CustomEntity } from '../../models/CustomEntity.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/customEntities` — read calls used by reference options. */
export const useCustomEntitiesApi = () => {
  const { tenant } = useDashboardContext()

  const getCustomEntities = useCallback(
    (
      paginationParams: Partial<PaginationProps>
    ): Promise<{ customEntities: CustomEntity[]; totalRecords: number }> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      return getCustomEntitiesCall(tenant, toApiPagination(paginationParams))
    },
    [tenant]
  )

  const getAllCustomEntities = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<CustomEntity[]> => {
      const fetchPage = async (p: Partial<PaginationProps>) => {
        const { customEntities, totalRecords } = await getCustomEntities(p)
        return { values: customEntities, totalRecords }
      }
      return fetchAllRecords(fetchPage, {
        currentPage: 1,
        rows: 100,
        ...pagination,
      })
    },
    [getCustomEntities]
  )

  return { getCustomEntities, getAllCustomEntities }
}
