import { useCallback } from 'react'
import { getVendorsCall } from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { Vendor } from '../../models/Vendor.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'

/** Lean port of MD `hooks/api/vendors` — the list call the vendors selector uses. */
export const useVendorsApi = () => {
  const { tenant } = useDashboardContext()

  const getVendors = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      params?: Record<string, string>
    ): Promise<{ values: Vendor[]; totalRecords: number }> => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return getVendorsCall(
        tenant,
        toApiPagination(paginationParams),
        params
      ) as unknown as Promise<{ values: Vendor[]; totalRecords: number }>
    },
    [tenant]
  )

  return { getVendors }
}
