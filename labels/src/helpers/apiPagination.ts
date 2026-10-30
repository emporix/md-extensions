import type { PaginationProps as DashboardPaginationProps } from '../hooks/usePagination'

/** Subset of DataTable pagination state used by @emporix/api-calls query builders */
export type ApiPaginationProps = {
  currentPage?: number
  rows?: number
  first?: number
  sortOrder?: number | null
  sortField?: string | null
  filters?: Record<string, unknown> | null
  [key: string]: unknown
}

/** Bridge dashboard pagination state to @emporix/api-calls call signatures */
/** Bridges dashboard DataTable state to @emporix/api-calls pagination params */
export const toApiPagination = (
  pagination: Partial<DashboardPaginationProps>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => pagination

export const apiPagination = (
  pagination: Partial<ApiPaginationProps>
): Partial<DashboardPaginationProps> =>
  pagination as Partial<DashboardPaginationProps>
