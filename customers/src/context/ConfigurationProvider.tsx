import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  fetchBasicConfiguration,
  TableConfig,
  updateSingleConfiguration,
} from '../api/configuration'
import { Props } from '../helpers/props'
import {
  Configuration,
  Currency,
  Language,
  TableConfiguration,
} from '../models/Configuration'
import { ColumnVisibility } from '../components/shared/TableExtensions'
import { DisplayMixin } from '../models/DisplayMixin'
import { useDashboardContext } from './Dashboard.context.tsx'

interface ConfigurationContextType {
  configuration: Configuration | undefined
  languages: Language[]
  currencies: Currency[]
  contentLanguage: string | null
  setContentLanguage: (langKey: string) => void
  refreshConfiguration: () => Promise<void>
  tableConfigurations: TableConfiguration[]
  fetchVisibleColumns: (configurationKey: string) => string[]
  fetchTableConfiguration: (configurationKey: string) => ColumnVisibility[]
  getTableMixinColumns: (configurationKey: string) => DisplayMixin[]
  updateTableConfiguration: (
    tenant: string,
    configurationKey: string,
    tableConfig: TableConfig
  ) => Promise<void>
}

const ConfigurationContext = createContext<ConfigurationContextType>({
  configuration: undefined,
  languages: [],
  currencies: [],
  contentLanguage: null,
  setContentLanguage: (_langKey: string) => {
    throw `not implemented`
  },
  tableConfigurations: [],
  refreshConfiguration: () => {
    throw `not implemented`
  },
  fetchVisibleColumns: (_configurationKey: string) => {
    throw `not implemented`
  },
  fetchTableConfiguration: (_configurationKey: string) => {
    throw `not implemented`
  },
  getTableMixinColumns: (_configurationKey: string) => {
    throw `not implemented`
  },
  updateTableConfiguration: (
    _tenant: string,
    _configurationKey: string,
    _tableConfig: TableConfig
  ) => {
    throw `not implemented`
  },
})

export const useConfiguration = () => useContext(ConfigurationContext)

export const ConfigurationProvider = ({ children }: Props) => {
  const { tenant, contentLanguage: hostContentLanguage } = useDashboardContext()
  const [configuration, setConfig] = useState<Configuration>()
  const [tableConfigurations, setTableConfigurations] = useState<
    TableConfiguration[]
  >([])
  const [contentLanguage, setContentLanguageState] = useState<string | null>(
    () => hostContentLanguage || null
  )

  useEffect(() => {
    if (hostContentLanguage) {
      setContentLanguageState(hostContentLanguage)
    }
  }, [hostContentLanguage])

  const setContentLanguage = (langKey: string) =>
    setContentLanguageState(langKey)

  useEffect(() => {
    ;(async () => {
      await refreshConfiguration()
    })()
  }, [tenant])

  const currencies = useMemo(
    () => configuration?.currencies || [],
    [configuration]
  )

  const languages = useMemo(
    () => configuration?.languages || [],
    [configuration]
  )

  const fetchVisibleColumns = (configurationKey: string) => {
    const columns = tableConfigurations.find(
      (el) => el.key === configurationKey
    )?.columns
    return columns?.filter((col) => col.visible).map((col) => col.key) ?? []
  }

  const fetchTableConfiguration = (configurationKey: string) => {
    return (
      tableConfigurations.find((el) => el.key === configurationKey)?.columns ??
      []
    )
  }

  const getTableMixinColumns = (configurationKey: string) => {
    return (
      tableConfigurations.find((el) => el.key === configurationKey)?.mixins ??
      []
    )
  }

  const updateTableConfiguration = async (
    tenant: string,
    configurationKey: string,
    tableConfig: TableConfig
  ) => {
    await updateSingleConfiguration(tenant, configurationKey, {
      key: configurationKey,
      value: tableConfig,
    })
    await refreshConfiguration()
  }

  const refreshConfiguration = async () => {
    const c = await fetchBasicConfiguration(tenant)
    setTableConfigurations(c.tableConfigurations)
    setConfig(c)
  }

  return (
    <ConfigurationContext.Provider
      value={{
        configuration,
        currencies,
        languages,
        contentLanguage,
        setContentLanguage,
        refreshConfiguration,
        fetchVisibleColumns,
        fetchTableConfiguration,
        getTableMixinColumns,
        updateTableConfiguration,
        tableConfigurations,
      }}
    >
      {children}
    </ConfigurationContext.Provider>
  )
}
