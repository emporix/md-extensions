import { useCallback } from 'react'
import { getSegmentByIdCall, getSegmentsCall } from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { Segment } from '../../models/Segment.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/segments` — only the calls the mixins reference selector uses. */
export const useSegmentsApi = () => {
  const { tenant } = useDashboardContext()

  const getSegments = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      siteCode?: string,
      params?: Record<string, string>
    ): Promise<{ segments: Segment[]; totalRecords: number }> => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getSegmentsCall(
        tenant,
        toApiPagination(paginationParams),
        siteCode,
        params
      )
    },
    [tenant]
  )

  const getAllSegments = useCallback(
    (
      pagination?: Partial<PaginationProps>,
      siteCode?: string,
      params?: Record<string, string>
    ): Promise<Segment[]> => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      const initialPagination = apiPagination({
        currentPage: 1,
        rows: 100,
      })
      const fetchPage = async (page: Partial<PaginationProps>) => {
        const { segments, totalRecords } = await getSegmentsCall(
          tenant,
          { ...initialPagination, ...toApiPagination(page) },
          siteCode,
          params
        )
        return { values: segments, totalRecords }
      }
      return fetchAllRecords(fetchPage, pagination)
    },
    [tenant]
  )

  const getSegmentById = useCallback(
    (id: string): Promise<Segment> => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getSegmentByIdCall(tenant, id)
    },
    [tenant]
  )

  return { getSegments, getAllSegments, getSegmentById }
}
