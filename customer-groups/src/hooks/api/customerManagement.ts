import { useCallback } from 'react'
import { fetchLegalEntitiesCall } from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'
import type { PaginationProps } from '../../hooks/usePagination'
import { toApiPagination } from '../../helpers/apiPagination'

export const useCustomerManagementApi = () => {
  const { tenant } = useDashboardContext()

  const getLegalEntities = useCallback(
    (pagination: Partial<PaginationProps>, withContacts = true) => {
      if (tenant) {
        return fetchLegalEntitiesCall(tenant, toApiPagination(pagination), {
          withContacts,
        })
      }
      return Promise.reject(new Error('No tenant'))
    },
    [tenant]
  )

  return { getLegalEntities }
}
