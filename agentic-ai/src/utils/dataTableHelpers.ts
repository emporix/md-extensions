import { DataTableFilterMeta, DataTablePFSEvent } from 'primereact/datatable'
import { SEVERITY_TO_NUMBER_MAP } from '../constants/logConstants'
import { getDateFilter } from './dateHelpers'

export const convertFiltersToApi = (
  filters: DataTableFilterMeta,
  fieldMappings?: Record<string, string>,
  enumConversions?: Record<string, Record<string, string>>,
  dateFields?: string[]
): Record<string, string> => {
  const apiFilters: Record<string, string> = {}

  Object.entries(filters).forEach(([key, filterMeta]) => {
    if (filterMeta && typeof filterMeta === 'object' && 'value' in filterMeta) {
      const value = filterMeta.value
      if (value !== null && value !== undefined) {
        let apiValue: string
        const apiField = fieldMappings?.[key] || key

        if (dateFields?.includes(key) && value instanceof Date) {
          apiValue = getDateFilter(value)
        } else if (String(value).trim()) {
          apiValue = String(value).trim()
          if (enumConversions?.[key]?.[apiValue]) {
            apiValue = enumConversions[key][apiValue]
          }
        } else {
          return
        }

        apiFilters[apiField] = apiValue
      }
    }
  })

  return apiFilters
}

export const convertSeverityFiltersToApi = (
  filters: DataTableFilterMeta,
  fieldMappings?: Record<string, string>,
  dateFields?: string[]
): Record<string, string> => {
  return convertFiltersToApi(
    filters,
    fieldMappings,
    { severity: SEVERITY_TO_NUMBER_MAP },
    dateFields
  )
}

export const convertJobTypeToApi = (jobType: string): string => {
  switch (jobType) {
    case 'IMPORT':
      return 'import'
    case 'EXPORT':
      return 'export'
    case 'AGENT_CHAT':
      return 'agent_chat'
    default:
      return jobType.toLowerCase()
  }
}

export const handleDataTableSort = (
  event: DataTablePFSEvent,
  currentSortField: string,
  currentSortOrder: 1 | -1,
  fieldMappings?: Record<string, string>
): [string, 'ASC' | 'DESC', string, 1 | -1] => {
  const { sortField: newSortField } = event
  const apiField = fieldMappings?.[newSortField] || newSortField

  let apiOrder: 'ASC' | 'DESC'
  let newSortOrder: 1 | -1

  if (newSortField === currentSortField) {
    if (currentSortOrder === 1) {
      apiOrder = 'DESC'
      newSortOrder = -1
    } else {
      apiOrder = 'ASC'
      newSortOrder = 1
    }
  } else {
    apiOrder = 'ASC'
    newSortOrder = 1
  }

  return [apiField, apiOrder, newSortField, newSortOrder]
}

export const handleDataTablePage = (
  event: DataTablePFSEvent,
  currentPageSize: number
): ['pageSize' | 'page', number] => {
  const { first, rows } = event

  if (rows !== currentPageSize) {
    return ['pageSize', rows]
  }

  const newPageNumber = Math.floor(first / rows) + 1
  return ['page', newPageNumber]
}
