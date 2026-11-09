import { useMemo } from 'react'
import {
  createUnitCall,
  deleteUnitCall,
  getAllUnitTypesCall,
  getAllUnitsPaginatedCall,
  getUnitByCodeCall,
  updateUnitCall,
} from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import type { PaginationProps } from '../usePagination'
import type { Unit } from '../../models/Unit.model'

/**
 * The api-calls functions put the code into the URL path as is; a code with
 * `/`, `?`, `#` or `%` (for example `km/h`) must be encoded first.
 */
const pathSegment = (code: string) => encodeURIComponent(code)

/** Unit calls bound to the host tenant. */
export const useUnitsApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(
    () => ({
      /** One page; forwards the code, symbol, type, factor and name filters. */
      getUnitsPage: (params: Partial<PaginationProps>) =>
        getAllUnitsPaginatedCall(toApiPagination(params), tenant),
      getUnit: (code: string) => getUnitByCodeCall(tenant, pathSegment(code)),
      getUnitTypes: () => getAllUnitTypesCall(tenant),
      createUnit: (unit: Unit) => createUnitCall(tenant, unit),
      updateUnit: (code: string, unit: Unit) =>
        updateUnitCall(tenant, pathSegment(code), unit),
      deleteUnit: (code: string) => deleteUnitCall(tenant, pathSegment(code)),
    }),
    [tenant]
  )
}
