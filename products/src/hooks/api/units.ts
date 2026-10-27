import { useCallback } from 'react'
import { Unit } from '../../models/Unit.model'
import { PaginationProps } from '../usePagination'
import { type PaginatedResponse } from '@emporix/api-calls'
import { toApiPagination } from '../../helpers/apiPagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  getAllUnitsCall,
  getAllUnitsPaginatedCall,
  getUnitByCodeCall,
  getAllUnitTypesCall,
  createUnitCall,
  updateUnitCall,
  deleteUnitCall,
} from '@emporix/api-calls'

export interface Response<Type> {
  values: Type[]
  totalRecords: number
}
export const useUnitsApi = () => {
  const { tenant } = useDashboardContext()

  const getAllUnits = useCallback(async (): Promise<Response<Unit>> => {
    if (tenant) {
      return getAllUnitsCall(tenant)
    } else {
      return Promise.reject('No tenant provided')
    }
  }, [tenant])

  const getAllUnitsPaginated = useCallback(
    async (
      paginationParams: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Unit>> => {
      if (tenant) {
        return getAllUnitsPaginatedCall(
          toApiPagination(paginationParams),
          tenant
        )
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getUnitByCode = useCallback(
    async (code: string): Promise<Unit> => {
      if (tenant) {
        return getUnitByCodeCall(tenant, code)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getAllUnitTypes = useCallback(async () => {
    if (tenant) {
      return getAllUnitTypesCall(tenant)
    } else {
      return Promise.reject('No tenant provided')
    }
  }, [tenant])

  const createUnit = useCallback(
    async (unit: Unit) => {
      if (tenant) {
        return createUnitCall(tenant, unit)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )
  const deleteUnit = useCallback(
    async (code: string) => {
      if (tenant) {
        return deleteUnitCall(tenant, code)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const updateUnit = useCallback(
    async (code: string, unit: Unit) => {
      if (tenant) {
        return updateUnitCall(tenant, code, unit)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  return {
    getAllUnitsPaginated,
    getAllUnits,
    getUnitByCode,
    getAllUnitTypes,
    createUnit,
    deleteUnit,
    updateUnit,
  }
}
