import { useCallback } from 'react'
import {
  createQuoteCall,
  deleteQuoteCall,
  generateQuotePdfCall,
  getQuoteCall,
  listQuoteReasonsCall,
  listQuotesCall,
  patchQuoteCall,
  type QueryFilter,
  type QuoteCreate,
  type QuotePatchOperation,
} from '@emporix/api-calls/next'
import { fromDataTableState } from '@emporix/api-calls/primereact'
import {
  Quote,
  QuoteCreateRequest,
  QuoteEditOp,
  QuoteReason,
  QuoteUpdateRequest,
  QuoteUpdateStatusValue,
} from '../../models/Quotes.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { PaginationProps } from '../usePagination'

/** MD loaded every quote reason in one request; the endpoint takes 1000. */
const QUOTE_REASONS_PAGE = { pageNumber: 1, pageSize: 1000 }

const toPatchOperations = (
  operations: QuoteUpdateRequest[] | QuoteUpdateRequest
) =>
  (Array.isArray(operations)
    ? operations
    : [operations]) as QuotePatchOperation[]

/**
 * Quote calls bound to the host tenant, as MD `hooks/api/quotes`, on
 * `@emporix/api-calls/next`. They keep MD's results (`{ data, totalRecords }`,
 * the new quote's id), so the ported screens stay as in MD.
 */
export const useQuotesApi = () => {
  const { tenant } = useDashboardContext()

  const getQuotes = useCallback(
    async (paginationParams: Partial<PaginationProps>, siteCode?: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      const params = fromDataTableState(paginationParams)
      const siteFilter: QueryFilter[] = siteCode
        ? [{ field: 'siteCode', op: 'eq', value: siteCode }]
        : []
      const { values, totalRecords } = await listQuotesCall(
        { ...params, filters: [...siteFilter, ...(params.filters ?? [])] },
        { tenant }
      )
      return { data: values as unknown as Quote[], totalRecords }
    },
    [tenant]
  )

  const getQuoteById = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getQuoteCall(id, { tenant })
    },
    [tenant]
  )

  const createQuote = useCallback(
    async (quoteDraftData: Partial<QuoteCreateRequest>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      // The General form sends the required fields; MD typed the draft as a
      // Partial.
      const { id } = await createQuoteCall(quoteDraftData as QuoteCreate, {
        tenant,
      })
      return id
    },
    [tenant]
  )

  const updateQuote = useCallback(
    (
      quoteId: string,
      operations: QuoteUpdateRequest[] | QuoteUpdateRequest
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return patchQuoteCall(quoteId, toPatchOperations(operations), {
        tenant,
      })
    },
    [tenant]
  )

  const changeQuoteStatus = useCallback(
    (id: string, value: QuoteUpdateStatusValue) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      const payload = [
        {
          op: QuoteEditOp.replace,
          path: '/status',
          value,
        },
      ]
      return patchQuoteCall(id, toPatchOperations(payload), { tenant })
    },
    [tenant]
  )

  const deleteQuote = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteQuoteCall(id, { tenant })
    },
    [tenant]
  )

  const getQuotePdf = useCallback(
    (quoteId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return generateQuotePdfCall(quoteId, { tenant })
    },
    [tenant]
  )

  const getQuotesReasons = useCallback(async () => {
    if (!tenant) {
      return Promise.reject('no config')
    }
    const { values, totalRecords } = await listQuoteReasonsCall(
      QUOTE_REASONS_PAGE,
      { tenant }
    )
    return { data: values as unknown as QuoteReason[], totalRecords }
  }, [tenant])

  return {
    getQuotes,
    getQuoteById,
    changeQuoteStatus,
    deleteQuote,
    createQuote,
    updateQuote,
    getQuotePdf,
    getQuotesReasons,
  }
}
