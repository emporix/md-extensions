import { useCallback } from 'react'
import { fetchCurrencies } from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'

/** Lean port of MD `hooks/api/currencies` — the tenant currency list only. */
export const useCurrenciesApi = () => {
  const { tenant } = useDashboardContext()

  const syncCurrencies = useCallback(() => {
    if (!tenant) return Promise.reject(new Error('No tenant'))
    return fetchCurrencies(tenant)
  }, [tenant])

  return { syncCurrencies }
}
