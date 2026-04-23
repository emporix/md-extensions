import React, { createContext, useContext, useMemo } from 'react'
import { Props } from '../helpers/props'
import { useCurrencies } from '../hooks/useCurrencies'
import { Currency } from '../models/Currency'
import { useDashboardContext } from './Dashboard.context'

interface CurrencyContextType {
  loadCurrencies: () => void
  currencies: Currency[]
  selectedCurrency?: Currency
  currenciesDropdownOptions: { label: string; value: string }[]
  selectCurrency: (currencyCode: string) => void
}

const SelectionValuesContext = createContext<CurrencyContextType>({
  currencies: [],
  loadCurrencies: () => {},
  selectCurrency: () => {},
  selectedCurrency: {} as Currency,
  currenciesDropdownOptions: [],
})

export const useCurrencyContext = () => useContext(SelectionValuesContext)

/**
 * Selected currency prefers the host Management Dashboard currency (appState.currency.id).
 */
export const CurrencyProvider = (props: Props) => {
  const { children } = props
  const { currency: hostCurrency } = useDashboardContext()
  const {
    currencies,
    selectedCurrency: hookCurrency,
    selectCurrency,
    loadCurrencies,
    currenciesDropdownOptions,
  } = useCurrencies()

  const selectedCurrency = useMemo(() => {
    if (!currencies.length) return undefined
    const code = hostCurrency?.id
    if (code) {
      const match = currencies.find((c) => c.code === code)
      if (match) return match
    }
    return hookCurrency
  }, [currencies, hostCurrency?.id, hookCurrency])

  const value = useMemo(
    () => ({
      currencies,
      selectedCurrency,
      currenciesDropdownOptions,
      selectCurrency,
      loadCurrencies,
    }),
    [
      currencies,
      selectedCurrency,
      currenciesDropdownOptions,
      selectCurrency,
      loadCurrencies,
    ]
  )

  return (
    <SelectionValuesContext.Provider value={value}>
      {children}
    </SelectionValuesContext.Provider>
  )
}
