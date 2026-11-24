import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { Customer, Quote } from '../models/Quotes.model'
import { Props } from '../helpers/props'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
} from '../helpers/api'
import { isQuoteCompleted as isCompletedStatus } from '../helpers/quoteStatus.helpers'
import { useQuotesApi } from '../hooks/api/quotes'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { quotesListPath } from '../constants/paths'

interface QuoteData {
  quote: Quote | undefined
  isQuoteCompleted: boolean
  refreshData: () => void
  customer: Customer | undefined
  setCustomer: (customer: Customer) => void
}

const QuoteDataContext = createContext<QuoteData>({
  quote: undefined,
  isQuoteCompleted: false,
  refreshData: () => {
    //NOOP
  },
  customer: undefined,
  setCustomer: () => {
    // NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useQuoteData = () => useContext(QuoteDataContext)

/**
 * MD `QuoteDataProvider`: loads the quote of the route (nothing on `add`) and
 * leaves for the list with an error toast when it cannot be loaded. Only the
 * latest load of a mounted provider is applied, so a late response for a
 * previous id or tenant (the route remounts the provider) is dropped.
 */
export const QuoteDataProvider = ({ children }: Props) => {
  const { quoteId } = useParams()
  const [quote, setQuote] = useState<Quote>()
  const [customer, setCustomer] = useState<Customer | undefined>(undefined)
  const [isQuoteCompleted, setIsQuoteCompleted] = useState<boolean>(false)
  const { getQuoteById } = useQuotesApi()
  const { navigate } = useCustomNavigate()
  const toast = useToast()
  const { t } = useTranslation()
  const trackRequest = useRef(createRequestTracker()).current

  // A new request id on unmount makes every pending load stale.
  useEffect(() => () => void trackRequest(), [trackRequest])

  // Recreated on every render, as in MD: the page reloads the mixin forms
  // whenever the provider renders (`useEffect(..., [refreshData])`).
  const refreshData = async () => {
    if (!quoteId) return
    await loadLatest(
      trackRequest,
      () => getQuoteById(quoteId) as unknown as Promise<Quote>,
      (fetchedQuote) => {
        setQuote(fetchedQuote)
        setIsQuoteCompleted(isCompletedStatus(fetchedQuote.status.value))
        if (fetchedQuote.businessModel === 'B2C') {
          setCustomer(fetchedQuote.customer as unknown as Customer)
        }
      },
      (e) => {
        navigate(quotesListPath())
        toast.showError(t('quotes.toasts.errorFetch'), getApiErrorDetails(e))
      }
    )
  }

  useEffect(() => {
    void refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: load per id
  }, [quoteId])

  return (
    <QuoteDataContext.Provider
      value={{ quote, isQuoteCompleted, refreshData, customer, setCustomer }}
    >
      {children}
    </QuoteDataContext.Provider>
  )
}
