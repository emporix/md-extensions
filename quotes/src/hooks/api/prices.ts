import { useCallback } from 'react'
import {
  matchPricesCall,
  type PriceMatchRequest as ApiPriceMatchRequest,
} from '@emporix/api-calls/next'
import { PriceMatchRequest } from '../../models/Price.model'
import { useDashboardContext } from '../../context/Dashboard.context'

/**
 * Price matching bound to the host tenant, as MD `hooks/api/prices_v2`, on
 * `@emporix/api-calls/next`.
 */
export const usePricesApi = () => {
  const { tenant } = useDashboardContext()

  const matchPrices = useCallback(
    (data: PriceMatchRequest) => {
      if (tenant) {
        return matchPricesCall(data as ApiPriceMatchRequest, { tenant })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return { matchPrices }
}
