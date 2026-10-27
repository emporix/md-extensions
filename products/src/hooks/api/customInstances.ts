import { useCallback } from 'react'
import {
  getCustomInstanceByIdCall,
  getCustomInstancesCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { CustomInstance } from '../../models/CustomInstance.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/customInstances` — read calls used by mixin references. */
export const useCustomInstancesApi = () => {
  const { tenant } = useDashboardContext()

  const getCustomInstances = useCallback(
    (
      type: string,
      paginationParams: Partial<PaginationProps>
    ): Promise<{ customInstances: CustomInstance[]; totalRecords: number }> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!type) {
        return Promise.reject('No type provided')
      }
      return getCustomInstancesCall(
        tenant,
        type,
        toApiPagination(paginationParams)
      )
    },
    [tenant]
  )

  const getCustomInstanceById = useCallback(
    (type: string, id: string): Promise<CustomInstance> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!type) {
        return Promise.reject('No type provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      return getCustomInstanceByIdCall(tenant, type, id)
    },
    [tenant]
  )

  const getAllCustomInstances = useCallback(
    (
      type: string,
      pagination?: Partial<PaginationProps>
    ): Promise<CustomInstance[]> => {
      const fetchPage = async (p: Partial<PaginationProps>) => {
        const { customInstances, totalRecords } = await getCustomInstances(
          type,
          p
        )
        return { values: customInstances, totalRecords }
      }
      return fetchAllRecords(fetchPage, {
        currentPage: 1,
        rows: 100,
        ...pagination,
      })
    },
    [getCustomInstances]
  )

  return { getCustomInstances, getAllCustomInstances, getCustomInstanceById }
}
