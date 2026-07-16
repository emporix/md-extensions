import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { fetchBasicConfiguration } from '@emporix/api-calls'
import {
  Configuration,
  Currency,
  Language,
} from '../models/Configuration.model'
import { useDashboardContext } from './Dashboard.context'

type ConfigurationContextType = {
  configuration: Configuration | undefined
  languages: Language[]
  currencies: Currency[]
  contentLanguage: string
  currentCurrency: Currency | undefined
  refreshConfiguration: () => Promise<void>
}

const ConfigurationContext = createContext<ConfigurationContextType>({
  configuration: undefined,
  languages: [],
  currencies: [],
  contentLanguage: 'en',
  currentCurrency: undefined,
  refreshConfiguration: async () => {
    throw new Error('not implemented')
  },
})

export const useConfiguration = () => useContext(ConfigurationContext)

export const ConfigurationProvider = ({ children }: PropsWithChildren) => {
  const { tenant, contentLanguage, currency } = useDashboardContext()
  const [configuration, setConfig] = useState<Configuration>()

  const refreshConfiguration = async () => {
    if (!tenant) return
    const c = await fetchBasicConfiguration(tenant)
    setConfig(c)
  }

  useEffect(() => {
    void refreshConfiguration()
  }, [tenant, contentLanguage])

  const currencies = useMemo(
    () => configuration?.currencies ?? [],
    [configuration]
  )

  const languages = useMemo(
    () => configuration?.languages ?? [],
    [configuration]
  )

  const currentCurrency = useMemo(() => {
    if (currency) {
      return currency
    }
    return currencies.find((c) => c.default) ?? currencies[0]
  }, [currency, currencies])

  return (
    <ConfigurationContext.Provider
      value={{
        configuration,
        currencies,
        languages,
        contentLanguage,
        currentCurrency,
        refreshConfiguration,
      }}
    >
      {children}
    </ConfigurationContext.Provider>
  )
}
