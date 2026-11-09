import { useCallback, useEffect, useMemo, useState } from 'react'
import { Currency } from '../models/Currency.model'
import { useCurrenciesApi } from './api/currencies'
import { useLocalizedValue } from './useLocalizedValue'
import { useDashboardContext } from '../context/Dashboard.context'
import { useConfiguration } from '../context/ConfigurationProvider'

export const useCurrencies = () => {
  const { tenant } = useDashboardContext()
  const { syncCurrencies } = useCurrenciesApi()
  // The host owns the active currency (AppState.currency); the remote only reads it.
  const { currentCurrency } = useConfiguration()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>()
  const { getContentLangValue } = useLocalizedValue()

  const loadCurrencies = async () => {
    const curr = await syncCurrencies()
    setCurrencies(curr)
    const initialCurrency =
      curr.find((item) => item.code === currentCurrency?.id) || curr[0]
    setSelectedCurrency(initialCurrency)
  }

  useEffect(() => {
    ;(async () => {
      await loadCurrencies()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity (reload per tenant)
  }, [tenant])

  useEffect(() => {
    if (!currencies.length) return

    const nextCurrency =
      currencies.find((item) => item.code === currentCurrency?.id) ||
      currencies[0]
    if (!nextCurrency) return

    setSelectedCurrency((previousCurrency) =>
      previousCurrency?.code === nextCurrency.code
        ? previousCurrency
        : nextCurrency
    )
  }, [currencies, currentCurrency?.id])

  const selectCurrency = useCallback(
    (currencyCode: string) => {
      const currency = currencies.find((curr) => curr.code === currencyCode)
      if (!currency) return

      setSelectedCurrency(currency)
    },
    [currencies]
  )

  const currenciesDropdownOptions = useMemo(() => {
    return currencies.map((curr) => ({
      label: `${curr.code} - ${getContentLangValue(curr.name)}`,
      value: curr.code,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [currencies])

  return {
    loadCurrencies,
    selectCurrency,
    currencies,
    selectedCurrency,
    currenciesDropdownOptions,
  }
}
