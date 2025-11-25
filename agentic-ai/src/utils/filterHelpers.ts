import { DataTableFilterMeta } from 'primereact/datatable'

/**
 * Converts PrimeReact filter format to API format
 * @param filters - PrimeReact filter state
 * @param fieldMapping - Optional mapping from UI field names to API field names
 * @returns API-ready filters object
 */
export const convertFiltersToApiFormat = (
  filters: DataTableFilterMeta,
  fieldMapping: Record<string, string> = {}
): Record<string, string> => {
  const apiFilters: Record<string, string> = {}

  // Default field mappings
  const defaultFieldMapping: Record<string, string> = {
    agentId: 'id',
    ...fieldMapping,
  }

  // Convert PrimeReact filter format to API format
  Object.entries(filters).forEach(([key, filterMeta]) => {
    if (filterMeta && typeof filterMeta === 'object' && 'value' in filterMeta) {
      const value = filterMeta.value
      if (value !== null && value !== undefined && String(value).trim()) {
        // Use mapped field name if available, otherwise use original key
        const apiField = defaultFieldMapping[key] || key
        apiFilters[apiField] = String(value)
      }
    }
  })

  return apiFilters
}
