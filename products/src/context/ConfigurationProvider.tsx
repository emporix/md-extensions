import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  fetchBasicConfiguration,
  updateSingleConfiguration,
} from '@emporix/api-calls'
import {
  ColumnVisibility,
  Configuration,
  Currency,
  Language,
  TableConfig,
  TableConfiguration,
} from '../models/Configuration.model'
import type { DisplayMixin } from '../models/DisplayMixin'
import { useDashboardContext } from './Dashboard.context'

type ConfigurationContextType = {
  configuration: Configuration | undefined
  languages: Language[]
  currencies: Currency[]
  contentLanguage: string
  currentCurrency: Currency | undefined
  refreshConfiguration: () => Promise<void>
  tableConfigurations: TableConfiguration[]
  fetchTableConfiguration: (configurationKey: string) => ColumnVisibility[]
  fetchVisibleColumns: (configurationKey: string) => string[]
  getTableMixinColumns: (configurationKey: string) => DisplayMixin[]
  updateTableConfiguration: (
    configurationKey: string,
    tableConfig: TableConfig
  ) => Promise<void>
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
  tableConfigurations: [],
  fetchTableConfiguration: () => [],
  fetchVisibleColumns: () => [],
  getTableMixinColumns: () => [],
  updateTableConfiguration: async () => {
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

  const tableConfigurations = useMemo(
    () => configuration?.tableConfigurations ?? [],
    [configuration]
  )

  const fetchTableConfiguration = useCallback(
    (configurationKey: string) =>
      tableConfigurations.find((el) => el.key === configurationKey)?.columns ??
      [],
    [tableConfigurations]
  )

  /**
   * Keys of the columns the user has chosen to show. An empty result means
   * "no saved preference" — callers should then show every column.
   */
  const fetchVisibleColumns = useCallback(
    (configurationKey: string) =>
      fetchTableConfiguration(configurationKey)
        .filter((col) => col.visible)
        .map((col) => col.key),
    [fetchTableConfiguration]
  )

  /** Mixins the user has chosen to surface as extra table columns. */
  const getTableMixinColumns = useCallback(
    (configurationKey: string) =>
      tableConfigurations.find((el) => el.key === configurationKey)?.mixins ??
      [],
    [tableConfigurations]
  )

  const updateTableConfiguration = useCallback(
    async (configurationKey: string, tableConfig: TableConfig) => {
      if (!tenant) return
      await updateSingleConfiguration(tenant, configurationKey, {
        key: configurationKey,
        value: tableConfig,
      })
      await refreshConfiguration()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant]
  )

  return (
    <ConfigurationContext.Provider
      value={{
        configuration,
        currencies,
        languages,
        contentLanguage,
        currentCurrency,
        refreshConfiguration,
        tableConfigurations,
        fetchTableConfiguration,
        fetchVisibleColumns,
        getTableMixinColumns,
        updateTableConfiguration,
      }}
    >
      {children}
    </ConfigurationContext.Provider>
  )
}
