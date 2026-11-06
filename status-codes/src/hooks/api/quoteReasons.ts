import { useMemo } from 'react'
import {
  createQuoteReasonCall,
  deleteQuoteReasonCall,
  editQuoteReasonCall,
  getQuoteReasonByIdCall,
  getQuotesReasonsCall,
} from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'
import type {
  QuoteReason,
  QuoteReasonPayload,
} from '../../models/QuoteReason.model'

/** Quote-reason calls bound to the host tenant. */
export const useQuoteReasonsApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(
    () => ({
      getQuoteReasons: async (): Promise<QuoteReason[]> => {
        const { data } = await getQuotesReasonsCall(tenant)
        return data
      },
      getQuoteReason: (id: string) => getQuoteReasonByIdCall(tenant, id),
      /** Resolves to the id of the new quote reason. */
      createQuoteReason: (payload: QuoteReasonPayload): Promise<string> =>
        createQuoteReasonCall(tenant, payload),
      editQuoteReason: (id: string, payload: QuoteReasonPayload) =>
        editQuoteReasonCall(tenant, id, payload),
      deleteQuoteReason: (id: string) => deleteQuoteReasonCall(tenant, id),
    }),
    [tenant]
  )
}
