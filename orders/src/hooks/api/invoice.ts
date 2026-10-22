import { useCallback } from 'react'
import { getInvoiceJobStatusCall, sendInvoiceJobCall } from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useInvoiceApi = () => {
  const { tenant } = useDashboardContext()

  const sendInvoiceJob = useCallback(
    async (orderId: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return sendInvoiceJobCall(tenant, orderId)
    },
    [tenant]
  )

  const getInvoiceJobStatus = useCallback(
    async (jobId: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return getInvoiceJobStatusCall(tenant, jobId)
    },
    [tenant]
  )

  return { sendInvoiceJob, getInvoiceJobStatus }
}
