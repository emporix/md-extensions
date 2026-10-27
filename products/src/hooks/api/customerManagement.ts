import { useCallback } from 'react'
import {
  fetchLegalEntitiesCall,
  fetchLegalEntityCall,
} from '@emporix/api-calls'
import { PaginatedResponse, PaginationProps } from '../usePagination'
import { LegalEntity } from '../../models/LegalEntity.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/customerManagement` — legal entities only. */
export const useCustomerManagementApi = () => {
  const { tenant } = useDashboardContext()

  const getLegalEntities = useCallback(
    (
      pagination: Partial<PaginationProps>,
      withContacts = true
    ): Promise<PaginatedResponse<LegalEntity>> => {
      if (tenant) {
        return fetchLegalEntitiesCall(tenant, toApiPagination(pagination), {
          withContacts,
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllLegalEntities = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<LegalEntity[]> =>
      fetchAllRecords((p) => getLegalEntities(p, false), {
        currentPage: 1,
        rows: 100,
        ...pagination,
      }),
    [getLegalEntities]
  )

  const getLegalEntity = useCallback(
    (legalEntityId: string): Promise<LegalEntity> => {
      if (tenant) {
        return fetchLegalEntityCall(tenant, legalEntityId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return { getLegalEntities, getAllLegalEntities, getLegalEntity }
}
