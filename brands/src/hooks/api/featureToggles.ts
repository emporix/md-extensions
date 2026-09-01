import { useCallback } from 'react'
import {
  getFeatureToggleValuesCall,
  type FeatureToggleValue,
} from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { toApiPagination } from '../../helpers/apiPagination'
import type { PaginationProps } from '../usePagination'

export type { FeatureToggleValue }

export const useFeatureTogglesApi = () => {
  const { tenant } = useDashboardContext()

  const getAllFeatureToggleValues = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<FeatureToggleValue[]> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }

      return fetchAllRecords(
        (page) => getFeatureToggleValuesCall(tenant, toApiPagination(page)),
        {
          currentPage: 1,
          rows: 1000,
          ...pagination,
        }
      )
    },
    [tenant]
  )

  return { getAllFeatureToggleValues }
}
