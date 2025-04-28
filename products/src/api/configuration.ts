import { useCallback } from 'react'
import { api } from '.'
import {
  Configuration,
  Currency,
  ExtendedOrderStatus,
  Language,
  TableConfiguration,
} from '../models/Configuration'
import { ColumnVisibility } from '../components/shared/TableExtensions'
import { ConfigSchema } from '../models/Settings'
import { DisplayMixin } from '../models/DisplayMixin'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

interface Config {
  key: string
  value: string | TableConfig | ExtendedOrderStatus[] | any
}

export interface TableConfig {
  table: {
    columns: ColumnVisibility[]
    mixins: DisplayMixin[]
  }
}

const KEY_CURRENCY = 'project_curr'
const KEY_LANG = 'project_lang'
const TABLE_CONFIGURATIONS = [
  'ext_brands',
  'ext_categories',
  'ext_companies',
  'ext_custom_entity',
  'ext_custom_instance',
  'ext_customers',
  'ext_countries',
  'ext_coupons',
  'ext_catalogs',
  'ext_extensions',
  'ext_labels',
  'ext_orders',
  'ext_returns',
  'ext_picklists',
  'ext_price_lists',
  'ext_products',
  'ext_quotes',
]

const extractObject = <T extends string | boolean | ExtendedOrderStatus[]>(
  key: string,
  config: Config[]
): T => {
  const result = config.find((item) => {
    return item.key === key
  })
  return result?.value as T
}

const extractTableConfigurations = (config: Config[]): TableConfiguration[] => {
  const configs: TableConfiguration[] = []
  config.forEach((item) => {
    const result = TABLE_CONFIGURATIONS.find((tableConfig) => {
      return item.key.startsWith(tableConfig)
    })
    if (result) {
      return configs.push({
        key: item.key,
        columns: item?.value.table?.columns,
        mixins: item?.value.table?.mixins,
      })
    }
  })
  return configs
}

export const fetchBasicConfiguration = async (
  tenant: string
): Promise<Configuration> => {
  const resp = await api.get(`/configuration/${tenant}/basic-configuration`)
  const configs: Config[] = resp.data

  const rawCurrencies = extractObject<string>(KEY_CURRENCY, configs)
  const currencies: Currency[] = JSON.parse(rawCurrencies)

  const rawLanguages = extractObject<string>(KEY_LANG, configs)
  const languages: Language[] = JSON.parse(rawLanguages)
  const tableConfigurations = extractTableConfigurations(configs) || null

  return {
    currencies,
    languages,
    tableConfigurations,
  }
}

export const fetchSingleConfiguration = async (
  tenant: string,
  configurationKey: string
): Promise<Config> => {
  const resp = await api.get(
    `/configuration/${tenant}/configurations/${configurationKey}`
  )
  return resp.data
}

export const updateSingleConfiguration = async (
  tenant: string,
  configurationKey: string,
  data: ConfigSchema
): Promise<boolean> => {
  try {
    const resp = await api.put(
      `/configuration/${tenant}/configurations/${configurationKey}`,
      { key: configurationKey, value: data.value }
    )
    return resp.status === 200
  } catch (error) {
    return await createSingleConfiguration(tenant, configurationKey, data.value)
  }
}

export const createSingleConfiguration = async (
  tenant: string,
  configurationKey: string,
  data: any
): Promise<boolean> => {
  const resp = await api.post(`/configuration/${tenant}/configurations/`, [
    {
      key: configurationKey,
      value: data,
      version: 1,
    },
  ])
  return resp.status === 200
}

export const useConfigurationApi = () => {
  const { tenant } = useDashboardContext()

  const getSingleConfiguration = useCallback(
    (key: string) => {
      if (tenant) {
        return fetchSingleConfiguration(tenant, key)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return { getSingleConfiguration }
}
