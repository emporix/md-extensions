import { api } from './index'
import { Currency, CurrencyExchange } from '../models/Currency'
import { useCallback } from 'react'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQueryParams,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { useDashboardContext } from '../context/Dashboard.context.tsx'
import { Metadata } from '../models/Metadata.ts'

export interface PaginatedResponse<Type> {
  values: Type[]
  totalRecords: number
}

export const fetchCurrencies = async (tenant: string): Promise<Currency[]> => {
  const params = {
    pageSize: '1000',
    sort: 'name,code:desc',
  }
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<Currency[]>(`currency/${tenant}/currencies`, {
    params,
    headers,
  })
  return data
}

export const fetchPaginatedCurrencies = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Currency>> => {
  const params = {
    ...formatFilterQueryParams(pagination.filters),
    sort: formatPaginationParamsForSorting(pagination),
    ...formatPaginationParamsForEmporixPagination(pagination),
  }

  const { data, headers } = await api.get<Currency[]>(
    `currency/${tenant}/currencies`,
    {
      params,
      headers: {
        'X-Version': 'v2',
        'x-total-count': true,
      },
    }
  )

  return { values: data, totalRecords: +headers['x-total-count'] }
}

export const fetchCurrency = async (tenant: string, code: CurrencyISO) => {
  const { data } = await api.get<Currency>(
    `currency/${tenant}/currencies/${code}`,
    {
      headers: {
        'X-Version': 'v2',
      },
    }
  )

  return data
}

export const deleteCurrency = async (tenant: string, code: CurrencyISO) => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.delete<Currency[]>(
    `currency/${tenant}/currencies/${code}`,
    {
      headers,
    }
  )

  return data
}

export const addCurrency = async (
  tenant: string,
  currency: Currency
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.post<Currency[]>(
    `currency/${tenant}/currencies`,
    {
      code: currency.code,
      name: currency.name,
    },
    {
      headers,
    }
  )

  return data
}

export type CurrencyISO = string
interface CreateCurrencyExchangeForm {
  sourceCurrency: CurrencyISO
  targetCurrency: CurrencyISO
  rate: number
  metadata: {
    version: number
  }
}

export const addCurrencyExchange = async (
  tenant: string,
  form: CreateCurrencyExchangeForm
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.post<Currency[]>(
    `currency/${tenant}/exchanges`,
    form,
    {
      headers,
    }
  )
  return data
}

interface RawCurrencyExchange {
  code: string
  sourceCurrency: string
  targetCurrency: string
  metadata: Metadata
  rate: string
}

export const getAllExchangeRates = async (
  tenant: string
): Promise<CurrencyExchange[]> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<RawCurrencyExchange[]>(
    `currency/${tenant}/exchanges`,
    {
      headers,
    }
  )
  return data.map((c) => ({ ...c, rate: parseFloat(c.rate) }))
}

export const getCurrencyExchange = async (
  tenant: string,
  code: CurrencyISO
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<Currency[]>(
    `currency/${tenant}/exchanges/${code}`,
    {
      headers,
    }
  )
  return data
}

export const putCurrencyExchange = async (
  tenant: string,
  form: CreateCurrencyExchangeForm
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.put<Currency[]>(
    `currency/${tenant}/exchanges/${form.sourceCurrency}_${form.targetCurrency}`,
    form,
    {
      headers,
    }
  )
  return data
}

export const postCurrencyExchange = async (
  tenant: string,
  form: CreateCurrencyExchangeForm
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.post<Currency[]>(
    `currency/${tenant}/exchanges`,
    form,
    {
      headers,
    }
  )
  return data
}

export const deleteCurrencyExchange = async (
  tenant: string,
  code: CurrencyISO
): Promise<unknown> => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.delete<Currency[]>(
    `currency/${tenant}/exchanges/${code}`,
    {
      headers,
    }
  )
  return data
}

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
        return fetchPaginatedCurrencies(tenant, pagination)
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
