import { FilterMatchMode } from 'primereact/api'
import { DataTableFilterMeta } from 'primereact/datatable'
import {
  convertJobTypeToApi,
  convertSeverityFiltersToApi,
} from './dataTableHelpers'

export type LogListNamespace = 'r' | 'j' | 's'

export type LogListTabQuery = {
  filters: DataTableFilterMeta
  sortField: string
  sortOrder: 1 | -1
  apiSortBy: string
  apiSortOrder: 'ASC' | 'DESC'
  rows: number
  apiFilters: Record<string, string>
}

export type LogListQuery = {
  agentId: string | undefined
  requests: LogListTabQuery
  jobs: LogListTabQuery
  sessions: LogListTabQuery
}

export type LogListQueryPatch = {
  filters?: DataTableFilterMeta
  sortField?: string
  sortOrder?: 1 | -1
  rows?: number
}

type FilterFieldDef = {
  tableField: string
  urlKey: string
  apiField: string
  matchMode: FilterMatchMode
  isDate?: boolean
}

type NamespaceConfig = {
  prefix: LogListNamespace
  fields: FilterFieldDef[]
  defaultSortField: string
  defaultSortOrder: 1 | -1
  fieldMappings: Record<string, string>
  dateFields: string[]
}

const ALLOWED_ROWS = [10, 25, 50, 100] as const
const DEFAULT_ROWS = 10
const DATE_PARAM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const REQUEST_FIELDS: FilterFieldDef[] = [
  {
    tableField: 'agentId',
    urlKey: 'agentId',
    apiField: 'triggerAgentId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'requestId',
    urlKey: 'requestId',
    apiField: 'requestId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'sessionId',
    urlKey: 'sessionId',
    apiField: 'sessionId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'lastActivity',
    urlKey: 'lastActivity',
    apiField: 'metadata.createdAt',
    matchMode: FilterMatchMode.CONTAINS,
    isDate: true,
  },
  {
    tableField: 'duration',
    urlKey: 'duration',
    apiField: 'duration',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'severity',
    urlKey: 'severity',
    apiField: 'severity',
    matchMode: FilterMatchMode.EQUALS,
  },
]

const JOB_FIELDS: FilterFieldDef[] = [
  {
    tableField: 'id',
    urlKey: 'id',
    apiField: 'id',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'agentId',
    urlKey: 'agentId',
    apiField: 'agentId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'type',
    urlKey: 'type',
    apiField: 'type',
    matchMode: FilterMatchMode.EQUALS,
  },
  {
    tableField: 'status',
    urlKey: 'status',
    apiField: 'status',
    matchMode: FilterMatchMode.EQUALS,
  },
  {
    tableField: 'createdAt',
    urlKey: 'createdAt',
    apiField: 'metadata.createdAt',
    matchMode: FilterMatchMode.CONTAINS,
    isDate: true,
  },
]

const SESSION_FIELDS: FilterFieldDef[] = [
  {
    tableField: 'sessionId',
    urlKey: 'sessionId',
    apiField: 'sessionId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'triggerAgentId',
    urlKey: 'triggerAgentId',
    apiField: 'triggerAgentId',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'agents',
    urlKey: 'agents',
    apiField: 'agents',
    matchMode: FilterMatchMode.CONTAINS,
  },
  {
    tableField: 'metadata.createdAt',
    urlKey: 'createdAt',
    apiField: 'metadata.createdAt',
    matchMode: FilterMatchMode.CONTAINS,
    isDate: true,
  },
  {
    tableField: 'metadata.modifiedAt',
    urlKey: 'modifiedAt',
    apiField: 'metadata.modifiedAt',
    matchMode: FilterMatchMode.CONTAINS,
    isDate: true,
  },
  {
    tableField: 'severity',
    urlKey: 'severity',
    apiField: 'severity',
    matchMode: FilterMatchMode.EQUALS,
  },
]

export const REQUEST_SORT_FIELD_MAP: Record<string, string> = {
  agentId: 'triggerAgentId',
  requestId: 'requestId',
  sessionId: 'sessionId',
  lastActivity: 'metadata.createdAt',
  createdAt: 'metadata.createdAt',
  duration: 'duration',
  severity: 'severity',
}

export const JOB_SORT_FIELD_MAP: Record<string, string> = {
  id: 'id',
  agentId: 'agentId',
  type: 'type',
  status: 'status',
  createdAt: 'metadata.createdAt',
}

export const SESSION_SORT_FIELD_MAP: Record<string, string> = {
  sessionId: 'sessionId',
  triggerAgentId: 'triggerAgentId',
  agents: 'agents',
  'metadata.createdAt': 'metadata.createdAt',
  'metadata.modifiedAt': 'metadata.modifiedAt',
  severity: 'severity',
}

const NAMESPACE_CONFIG: Record<LogListNamespace, NamespaceConfig> = {
  r: {
    prefix: 'r',
    fields: REQUEST_FIELDS,
    defaultSortField: 'lastActivity',
    defaultSortOrder: -1,
    fieldMappings: REQUEST_SORT_FIELD_MAP,
    dateFields: REQUEST_FIELDS.filter((field) => field.isDate).map(
      (field) => field.tableField
    ),
  },
  j: {
    prefix: 'j',
    fields: JOB_FIELDS,
    defaultSortField: 'createdAt',
    defaultSortOrder: -1,
    fieldMappings: JOB_SORT_FIELD_MAP,
    dateFields: JOB_FIELDS.filter((field) => field.isDate).map(
      (field) => field.tableField
    ),
  },
  s: {
    prefix: 's',
    fields: SESSION_FIELDS,
    defaultSortField: 'metadata.modifiedAt',
    defaultSortOrder: -1,
    fieldMappings: SESSION_SORT_FIELD_MAP,
    dateFields: SESSION_FIELDS.filter((field) => field.isDate).map(
      (field) => field.tableField
    ),
  },
}

export const toDateParam = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fromDateParam = (value: string): Date | null => {
  const match = DATE_PARAM_PATTERN.exec(value.trim())
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

const parseSearchParams = (search: string): URLSearchParams => {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
}

const toSearchString = (params: URLSearchParams): string => {
  const query = params.toString()
  return query ? `?${query}` : ''
}

const createEmptyFilters = (fields: FilterFieldDef[]): DataTableFilterMeta => {
  return fields.reduce<DataTableFilterMeta>((acc, field) => {
    acc[field.tableField] = { value: null, matchMode: field.matchMode }
    return acc
  }, {})
}

const parseRows = (value: string | null): number => {
  if (!value) {
    return DEFAULT_ROWS
  }
  const rows = Number(value)
  return ALLOWED_ROWS.includes(rows as (typeof ALLOWED_ROWS)[number])
    ? rows
    : DEFAULT_ROWS
}

const parseSort = (
  value: string | null,
  config: NamespaceConfig
): { sortField: string; sortOrder: 1 | -1 } => {
  if (!value) {
    return {
      sortField: config.defaultSortField,
      sortOrder: config.defaultSortOrder,
    }
  }
  const [field, order] = value.split(':')
  const knownField = config.fields.some((entry) => entry.tableField === field)
  if (!field || !knownField) {
    return {
      sortField: config.defaultSortField,
      sortOrder: config.defaultSortOrder,
    }
  }
  return {
    sortField: field,
    sortOrder: order === 'ASC' ? 1 : -1,
  }
}

const readFilterValue = (
  raw: string | null,
  field: FilterFieldDef
): unknown => {
  if (raw == null || raw.trim() === '') {
    return null
  }
  if (field.isDate) {
    return fromDateParam(raw)
  }
  return raw
}

export const getFilterValue = (
  filters: DataTableFilterMeta,
  field: string
): unknown => {
  const filterMeta = filters[field]
  if (filterMeta && typeof filterMeta === 'object' && 'value' in filterMeta) {
    return filterMeta.value
  }
  return null
}

const writeFilterValue = (
  value: unknown,
  field: FilterFieldDef
): string | null => {
  if (value == null) {
    return null
  }
  if (field.isDate) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return null
    }
    return toDateParam(value)
  }
  const asString = String(value).trim()
  return asString ? asString : null
}

const toApiFilters = (
  filters: DataTableFilterMeta,
  config: NamespaceConfig
): Record<string, string> => {
  const apiFilters = convertSeverityFiltersToApi(
    filters,
    Object.fromEntries(
      config.fields.map((field) => [field.tableField, field.apiField])
    ),
    config.dateFields
  )

  if (config.prefix === 'j') {
    const typeValue = getFilterValue(filters, 'type')
    if (typeValue != null && String(typeValue).trim()) {
      apiFilters.type = convertJobTypeToApi(String(typeValue).trim())
    }
  }

  return apiFilters
}

const parseNamespace = (
  params: URLSearchParams,
  config: NamespaceConfig
): LogListTabQuery => {
  const filters = createEmptyFilters(config.fields)

  config.fields.forEach((field) => {
    const raw = params.get(`${config.prefix}.${field.urlKey}`)
    filters[field.tableField] = {
      value: readFilterValue(raw, field),
      matchMode: field.matchMode,
    }
  })

  const { sortField, sortOrder } = parseSort(
    params.get(`${config.prefix}.sort`),
    config
  )
  const rows = parseRows(params.get(`${config.prefix}.rows`))
  const apiSortOrder: 'ASC' | 'DESC' = sortOrder === 1 ? 'ASC' : 'DESC'

  return {
    filters,
    sortField,
    sortOrder,
    apiSortBy: config.fieldMappings[sortField] ?? sortField,
    apiSortOrder,
    rows,
    apiFilters: toApiFilters(filters, config),
  }
}

const isDefaultSort = (
  sortField: string,
  sortOrder: 1 | -1,
  config: NamespaceConfig
): boolean => {
  return (
    sortField === config.defaultSortField &&
    sortOrder === config.defaultSortOrder
  )
}

const writeNamespaceParams = (
  params: URLSearchParams,
  config: NamespaceConfig,
  tab: LogListTabQuery
): void => {
  Array.from(params.keys()).forEach((key) => {
    if (key.startsWith(`${config.prefix}.`)) {
      params.delete(key)
    }
  })

  config.fields.forEach((field) => {
    const serialized = writeFilterValue(
      getFilterValue(tab.filters, field.tableField),
      field
    )
    if (serialized) {
      params.set(`${config.prefix}.${field.urlKey}`, serialized)
    }
  })

  if (!isDefaultSort(tab.sortField, tab.sortOrder, config)) {
    const order = tab.sortOrder === 1 ? 'ASC' : 'DESC'
    params.set(`${config.prefix}.sort`, `${tab.sortField}:${order}`)
  }

  if (tab.rows !== DEFAULT_ROWS) {
    params.set(`${config.prefix}.rows`, String(tab.rows))
  }
}

export const parseLogListQuery = (search: string): LogListQuery => {
  const params = parseSearchParams(search)
  const agentId = params.get('agentId')?.trim() || undefined

  return {
    agentId,
    requests: parseNamespace(params, NAMESPACE_CONFIG.r),
    jobs: parseNamespace(params, NAMESPACE_CONFIG.j),
    sessions: parseNamespace(params, NAMESPACE_CONFIG.s),
  }
}

export const getLogListAgentId = (search: string): string | undefined => {
  return parseLogListQuery(search).agentId
}

export const getNamespacedListKey = (
  search: string,
  namespace: LogListNamespace
): string => {
  const params = parseSearchParams(search)
  const keys = Array.from(params.keys())
    .filter((key) => key.startsWith(`${namespace}.`))
    .sort()
  return keys.map((key) => `${key}=${params.get(key) ?? ''}`).join('&')
}

const LIST_QUERY_NAMESPACE_PREFIXES = ['r.', 'j.', 's.'] as const

export const clearNamespacedListParams = (search: string): string => {
  const params = parseSearchParams(search)
  Array.from(params.keys()).forEach((key) => {
    if (
      LIST_QUERY_NAMESPACE_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      params.delete(key)
    }
  })
  return toSearchString(params)
}

export const writeNamespacedParams = (
  search: string,
  namespace: LogListNamespace,
  patch: LogListQueryPatch
): string => {
  const params = parseSearchParams(search)
  const current = parseLogListQuery(search)
  const tabKey =
    namespace === 'r' ? 'requests' : namespace === 'j' ? 'jobs' : 'sessions'
  const currentTab = current[tabKey]
  const nextTab: LogListTabQuery = {
    ...currentTab,
    filters: patch.filters ?? currentTab.filters,
    sortField: patch.sortField ?? currentTab.sortField,
    sortOrder: patch.sortOrder ?? currentTab.sortOrder,
    rows: patch.rows ?? currentTab.rows,
    apiSortBy: currentTab.apiSortBy,
    apiSortOrder: currentTab.apiSortOrder,
    apiFilters: currentTab.apiFilters,
  }
  const config = NAMESPACE_CONFIG[namespace]
  nextTab.apiSortBy =
    config.fieldMappings[nextTab.sortField] ?? nextTab.sortField
  nextTab.apiSortOrder = nextTab.sortOrder === 1 ? 'ASC' : 'DESC'
  nextTab.apiFilters = toApiFilters(nextTab.filters, config)

  writeNamespaceParams(params, config, nextTab)
  return toSearchString(params)
}
