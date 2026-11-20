import { useCallback } from 'react'
import { fetchAll, listCountriesCall } from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useCountriesApi = () => {
  const { tenant } = useDashboardContext()

  /** Every country of the tenant, sorted by code. */
  const syncAllCountries = useCallback(
    () => fetchAll(listCountriesCall, { sort: 'code:asc' }, { tenant }),
    [tenant]
  )

  return { syncAllCountries }
}
