import { useMemo } from 'react'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useLocalizedValue } from './useLocalizedValue'

export const useCurrencies = () => {
  const { currencies } = useConfiguration()
  const { getContentLangValue } = useLocalizedValue()

  const currenciesDropdownOptions = useMemo(() => {
    return currencies.map((curr) => ({
      label: `${curr.id} - ${getContentLangValue(curr.label)}`,
      value: curr.id,
    }))
  }, [currencies, getContentLangValue])

  return {
    currencies,
    currenciesDropdownOptions,
  }
}
