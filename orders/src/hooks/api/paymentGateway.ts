import { useCallback } from 'react'
import {
  fetchTransactionCall,
  getPaymentMethodsCall,
  refundCall,
} from '@emporix/api-calls'
import {
  capturePaymentCall,
  type PaymentCaptureResult,
} from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'
import type {
  PaymentMethod,
  PaymentTransaction,
} from '../../models/PaymentGateway.model'

export const usePaymentGatewayApi = () => {
  const { tenant } = useDashboardContext()

  const getPaymentMethods = useCallback(async (): Promise<PaymentMethod[]> => {
    if (!tenant) return Promise.reject(new Error('No tenant'))
    return getPaymentMethodsCall(tenant) as unknown as Promise<PaymentMethod[]>
  }, [tenant])

  const fetchTransaction = useCallback(
    async (transactionId: string): Promise<PaymentTransaction> => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return fetchTransactionCall(
        tenant,
        transactionId
      ) as unknown as Promise<PaymentTransaction>
    },
    [tenant]
  )

  const refundTransaction = useCallback(
    async (transactionId: string, amount: number, currency: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return refundCall(tenant, transactionId, amount, currency)
    },
    [tenant]
  )

  const captureTransaction = useCallback(
    async (
      transactionId: string,
      amount: number,
      currency: string
    ): Promise<PaymentCaptureResult> => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return capturePaymentCall(transactionId, { amount, currency }, { tenant })
    },
    [tenant]
  )

  return {
    getPaymentMethods,
    fetchTransaction,
    refundTransaction,
    captureTransaction,
  }
}
