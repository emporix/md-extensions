import { useCallback } from 'react'
import {
  calculateTaxCall,
  createTax,
  fetchAllTaxes,
  fetchAllTaxesUnpaginated,
  fetchTax,
  fetchTaxByTaxClassCode,
  removeTax,
  updateTax,
} from '@emporix/api-calls'
import { PaginatedResponse, PaginationProps } from '../usePagination'
import { toApiPagination } from '../../helpers/apiPagination'
import { Tax } from '../../models/Taxes.model'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useTaxesApi = () => {
  const { tenant } = useDashboardContext()

  const getAllTaxesPaginated = useCallback(
    async (
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Tax>> => {
      if (tenant) {
        const { values, totalRecords } = await fetchAllTaxes(
          tenant,
          toApiPagination(pagination)
        )
        return { values: values as Tax[], totalRecords }
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getAllTaxesUnpaginated = useCallback(async (): Promise<Tax[]> => {
    if (tenant) {
      return fetchAllTaxesUnpaginated(tenant) as Promise<Tax[]>
    } else {
      return Promise.reject('No tenant provided')
    }
  }, [tenant])

  const getTax = useCallback(
    async (taxLocationCode: string): Promise<Tax> => {
      if (tenant) {
        return fetchTax(tenant, taxLocationCode) as Promise<Tax>
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getTaxByClassCode = useCallback(
    async (taxClassCode: string): Promise<Tax> => {
      if (tenant) {
        return fetchTaxByTaxClassCode(tenant, taxClassCode) as Promise<Tax>
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const addTax = useCallback(
    async (tax: Tax): Promise<{ locationCode: string }> => {
      if (tenant) {
        return createTax(tenant, tax as Parameters<typeof createTax>[1])
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const editTax = useCallback(
    async (tax: Tax): Promise<boolean> => {
      if (tenant) {
        return updateTax(tenant, tax as Parameters<typeof updateTax>[1])
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const deleteTax = useCallback(
    async (taxLocationCode: string): Promise<boolean> => {
      if (tenant) {
        return removeTax(tenant, taxLocationCode)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const calculateTax = useCallback(
    async (
      price: number,
      country?: string,
      taxClass?: string
    ): Promise<number> => {
      if (!tenant || !country || !taxClass) {
        return price
      }
      return calculateTaxCall(tenant, price, country, taxClass)
    },
    [tenant]
  )

  return {
    getAllTaxesPaginated,
    getAllTaxesUnpaginated,
    editTax,
    getTax,
    addTax,
    deleteTax,
    getTaxByClassCode,
    calculateTax,
  }
}
