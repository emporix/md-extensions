import { useCallback } from 'react'
import {
  getReturnsCall,
  deleteReturnCall,
  updateReturnCall,
  patchReturnCall,
  createReturnCall,
  getReturnsDetailsCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import {
  ReturnDetails,
  ReturnForm,
  ReturnUpdateRequest,
} from '../../models/Returns.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'

export const useReturnsApi = () => {
  const { tenant } = useDashboardContext()

  const deleteReturns = useCallback(
    (ids: string[]) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return Promise.all(ids.map((id) => deleteReturnCall(tenant, id)))
    },
    [tenant]
  )

  const getReturns = useCallback(
    (pagination: Partial<PaginationProps>) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return getReturnsCall(tenant, toApiPagination(pagination))
    },
    [tenant]
  )

  const createReturn = useCallback(
    (form: ReturnForm) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return createReturnCall(tenant, form as never)
    },
    [tenant]
  )

  const getReturnsDetails = useCallback(
    (returnId: string) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return getReturnsDetailsCall(tenant, returnId) as Promise<ReturnDetails>
    },
    [tenant]
  )

  const updateReturn = useCallback(
    (returnDetails: ReturnDetails) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return updateReturnCall(tenant, returnDetails as never)
    },
    [tenant]
  )

  const patchReturn = useCallback(
    (id: string, operations: ReturnUpdateRequest[] | ReturnUpdateRequest) => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return patchReturnCall(tenant, id, operations)
    },
    [tenant]
  )

  return {
    getReturns,
    deleteReturns,
    getReturnsDetails,
    updateReturn,
    patchReturn,
    createReturn,
  }
}
