import { useCallback, useEffect, useMemo, useState } from 'react'
import { Currency } from '../models/Currency'
import { useCurrenciesApi } from '../api/currencies'
import { useLocalizedValue } from './useLocalizedValue'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const useCurrencies = () => {
  const { tenant } = useDashboardContext()
  const { syncCurrencies } = useCurrenciesApi()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>()
  const { getContentLangValue } = useLocalizedValue()

  const loadCurrencies = async () => {
    const curr = await syncCurrencies()
    setCurrencies(curr)
    setSelectedCurrency(curr[0])
  }

  useEffect(() => {
    ;(async () => {
      await loadCurrencies()
    })()
  }, [tenant])

  const selectCurrency = useCallback(
    (currencyCode: string) => {
      setSelectedCurrency(
        currencies.filter((curr) => curr.code === currencyCode)[0]
      )
    },
    [currencies]
  )

  const currenciesDropdownOptions = useMemo(() => {
    return currencies.map((curr) => ({
      label: `${curr.code} - ${getContentLangValue(curr.name)}`,
      value: curr.code,
    }))
  }, [currencies, getContentLangValue])

  return {
    loadCurrencies,
    selectCurrency,
    currencies,
    selectedCurrency,
    currenciesDropdownOptions,
  }
}
