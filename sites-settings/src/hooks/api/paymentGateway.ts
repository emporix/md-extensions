import { useCallback } from 'react'
import { listPaymentModesCall } from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'

/** Payment-gateway calls bound to the host tenant. */
export const usePaymentGatewayApi = () => {
  const { tenant } = useDashboardContext()

  /** The tenant's configured payment modes. */
  const getPaymentMethods = useCallback(
    () => listPaymentModesCall({ tenant }),
    [tenant]
  )

  return { getPaymentMethods }
}
