import { DataTableFilterMeta } from 'primereact/datatable'

export const convertFiltersToApiFormat = (
  filters: DataTableFilterMeta,
  fieldMapping: Record<string, string> = {}
): Record<string, string> => {
  const apiFilters: Record<string, string> = {}

  const defaultFieldMapping: Record<string, string> = {
    agentId: 'id',
    ...fieldMapping,
  }

  Object.entries(filters).forEach(([key, filterMeta]) => {
    if (filterMeta && typeof filterMeta === 'object' && 'value' in filterMeta) {
      const value = filterMeta.value
      if (value !== null && value !== undefined && String(value).trim()) {
        const apiField = defaultFieldMapping[key] || key
        apiFilters[apiField] = String(value)
      }
    }
  })

  return apiFilters
}
