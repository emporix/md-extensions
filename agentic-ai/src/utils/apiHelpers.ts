export interface QueryParamsOptions {
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  pageSize?: number
  pageNumber?: number
  agentId?: string
  filters?: Record<string, string>
}

export interface BuildQueryParamsConfig {
  agentIdField?: string
  exactMatchFields?: string[]
}

export const getApiHeaders = (
  includeTotalCount: boolean = false
): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (includeTotalCount) {
    headers['X-Total-Count'] = 'true'
  }
  return headers
}

export const buildQueryParams = (
  params: QueryParamsOptions,
  config: BuildQueryParamsConfig = {}
): string => {
  const { agentIdField = 'agentId', exactMatchFields = [] } = config

  const queryParams = new URLSearchParams()

  if (params.sortBy && params.sortOrder) {
    queryParams.append('sort', `${params.sortBy}:${params.sortOrder}`)
  }
  if (params.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }
  if (params.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  const qParts: string[] = []

  if (params.agentId) {
    qParts.push(`${agentIdField}:${params.agentId}`)
  }

  if (params.filters) {
    Object.entries(params.filters).forEach(([field, value]) => {
      if (value && value.trim()) {
        const trimmedValue = value.trim()
        const isDateRange =
          trimmedValue.startsWith('(>=') || trimmedValue.startsWith('(>')

        if (exactMatchFields.includes(field) || isDateRange) {
          const finalValue =
            exactMatchFields.includes(field) && !isDateRange
              ? trimmedValue.toUpperCase()
              : trimmedValue
          qParts.push(`${field}:${finalValue}`)
        } else {
          qParts.push(`${field}:~(${trimmedValue})`)
        }
      }
    })
  }

  if (qParts.length > 0) {
    queryParams.append('q', qParts.join(' '))
  }

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const parseTotalCount = (headers: Headers): number => {
  return parseInt(
    headers.get('x-total-count') || headers.get('X-Total-Count') || '0',
    10
  )
}
