import { createContext, ReactNode, useContext } from 'react'
import { useCurrencies } from '../hooks/useCurrencies'

type CurrencyContextValue = ReturnType<typeof useCurrencies>

const CurrencyContext = createContext<CurrencyContextValue>({
  loadCurrencies: async () => {
    // NOOP
  },
  selectCurrency: () => {
    // NOOP
  },
  currencies: [],
  selectedCurrency: undefined,
  currenciesDropdownOptions: [],
})

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrencyContext = () => useContext(CurrencyContext)

/**
 * MD `CurrencyProvider`: loads the tenant currencies once for the coupon form,
 * so its money fields share one list and one selected (host) currency.
 */
export const CurrencyProvider = ({
  children,
}: {
  readonly children: ReactNode
}) => {
  const value = useCurrencies()
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
