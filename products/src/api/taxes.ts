import { useCallback } from 'react'
import { api } from './index'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQueryParams,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { Tax } from '../models/Taxes'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export interface PaginatedResponse<Type> {
  values: Type[]
  totalRecords: number
}

export const fetchAllTaxes = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Tax>> => {
  const { data, headers } = await api.get<Tax[]>(`tax/${tenant}/taxes`, {
    params: {
      ...formatFilterQueryParams(pagination.filters),
      sort: formatPaginationParamsForSorting(pagination),
      ...formatPaginationParamsForEmporixPagination(pagination),
    },
    headers: {
      'x-total-count': true,
    },
  })

  return { values: data, totalRecords: +headers['x-total-count'] }
}

export const fetchAllTaxesUnpaginated = async (
  tenant: string
): Promise<Tax[]> => {
  const { data } = await api.get<Tax[]>(`tax/${tenant}/taxes`, {
    params: {
      pageSize: 9999,
    },
    headers: {
      'x-total-count': true,
    },
  })

  return data
}

export const fetchTax = async (
  tenant: string,
  taxLocationCode: string
): Promise<Tax> => {
  const { data } = await api.get<Tax>(`tax/${tenant}/taxes/${taxLocationCode}`)

  return data
}

export const fetchTaxByTaxClassCode = async (
  tenant: string,
  taxClassCode: string
): Promise<Tax> => {
  const { data } = await api.get<Tax[]>(`tax/${tenant}/taxes`, {
    params: { taxClassCode },
  })

  return data[0]
}

export const createTax = async (
  tenant: string,
  tax: Tax
): Promise<{ locationCode: string }> => {
  const { data } = await api.post(`tax/${tenant}/taxes/`, { ...tax })
  return data
}

export const updateTax = async (tenant: string, tax: Tax): Promise<boolean> => {
  const updateResponse = await api.put(
    `tax/${tenant}/taxes/${tax.location.countryCode}`,
    { ...tax }
  )

  return updateResponse.status === 204
}

export const removeTax = async (
  tenant: string,
  taxLocationCode: string
): Promise<boolean> => {
  const updateResponse = await api.delete(
    `tax/${tenant}/taxes/${taxLocationCode}`
  )

  return updateResponse.status === 204
}

export const useTaxesApi = () => {
  const { tenant } = useDashboardContext()

  const getAllTaxesPaginated = useCallback(
    async (
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Tax>> => {
      if (tenant) {
        return fetchAllTaxes(tenant, pagination)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getAllTaxesUnpaginated = useCallback(async (): Promise<Tax[]> => {
    if (tenant) {
      return fetchAllTaxesUnpaginated(tenant)
    } else {
      return Promise.reject('No tenant provided')
    }
  }, [tenant])

  const getTax = useCallback(
    async (taxLocationCode: string): Promise<Tax> => {
      if (tenant) {
        return fetchTax(tenant, taxLocationCode)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getTaxByClassCode = useCallback(
    async (taxClassCode: string): Promise<Tax> => {
      if (tenant) {
        return fetchTaxByTaxClassCode(tenant, taxClassCode)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const addTax = useCallback(
    async (tax: Tax): Promise<{ locationCode: string }> => {
      if (tenant) {
        return createTax(tenant, tax)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const editTax = useCallback(
    async (tax: Tax): Promise<boolean> => {
      if (tenant) {
        return updateTax(tenant, tax)
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
      if (!country || !taxClass) {
        return price
      }
      const body = {
        input: {
          targetLocation: {
            countryCode: country,
          },
          targetTaxClass: taxClass,
          includesTax: false,
          price: price,
        },
      }
      const { data } = await api.put(
        `tax/${tenant}/taxes/calculation-commands`,
        body
      )
      return data?.output?.grossPrice
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
