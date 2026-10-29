import { Currency } from '../../models/Currency.model'
import { useCallback } from 'react'
import { PaginationProps } from '../usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  fetchCurrencies,
  fetchPaginatedCurrencies,
  fetchCurrency,
  deleteCurrency,
  addCurrency,
  addCurrencyExchange,
  getAllExchangeRates,
  putCurrencyExchange,
  postCurrencyExchange,
  deleteCurrencyExchange,
  type PaginatedResponse,
  type CurrencyISO,
} from '@emporix/api-calls'
import { toApiPagination } from '../../helpers/apiPagination'

export const useCurrenciesApi = () => {
  const { tenant } = useDashboardContext()

  const syncCurrencies = useCallback(() => {
    if (tenant) {
      return fetchCurrencies(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getCurrenciesPaginated = useCallback(
    (
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Currency>> => {
      if (tenant) {
        return fetchPaginatedCurrencies(tenant, toApiPagination(pagination))
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const syncAllCurrencyExchanges = useCallback(() => {
    if (tenant) {
      return getAllExchangeRates(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getCurrencyByCode = useCallback(
    (code: CurrencyISO) => {
      if (tenant) {
        return fetchCurrency(tenant, code)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createCurrencyExchange = useCallback(
    (
      sourceCurrency: CurrencyISO,
      targetCurrency: CurrencyISO,
      rate: number
    ) => {
      if (tenant) {
        return postCurrencyExchange(tenant, {
          sourceCurrency,
          targetCurrency,
          rate,
          metadata: {
            version: 1,
          },
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )
  const updateCurrencyExchange = useCallback(
    (
      sourceCurrency: CurrencyISO,
      targetCurrency: CurrencyISO,
      rate: number,
      metadata: {
        version: number
      }
    ) => {
      if (tenant) {
        return putCurrencyExchange(tenant, {
          sourceCurrency,
          targetCurrency,
          rate,
          metadata,
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const removeCurrencyExchange = useCallback(
    (code: CurrencyISO) => {
      if (tenant) {
        return deleteCurrencyExchange(tenant, code)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const removeCurrency = useCallback(
    (code: CurrencyISO) => {
      if (tenant) {
        return deleteCurrency(tenant, code)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const addCurrencies = useCallback(
    (currencies: Currency[]) => {
      if (tenant) {
        return Promise.all(
          currencies.map(async (currency) => {
            await addCurrency(tenant, currency)
          })
        )
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )
  return {
    removeCurrency,
    syncCurrencies,
    addCurrencies,
    syncAllCurrencyExchanges,
    createCurrencyExchange,
    updateCurrencyExchange,
    addCurrencyExchange,
    removeCurrencyExchange,
    getCurrencyByCode,
    getCurrenciesPaginated,
  }
}
