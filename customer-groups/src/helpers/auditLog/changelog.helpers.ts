import { ChangelogChangeType } from '@emporix/api-calls'
import type {
  ChangelogQueryOptions,
  ChangelogPagination,
} from '@emporix/api-calls'
import type { PaginationProps } from '../../hooks/usePagination'

export const toChangelogPagination = (
  pagination?: Partial<PaginationProps>
): ChangelogPagination | undefined => {
  if (pagination?.currentPage === undefined && pagination?.rows === undefined) {
    return undefined
  }

  return {
    currentPage: pagination.currentPage,
    rows: pagination.rows,
  }
}

export const toChangelogOptions = (
  options?: ChangelogQueryOptions & { pagination?: Partial<PaginationProps> }
): ChangelogQueryOptions | undefined => {
  if (!options) {
    return undefined
  }

  const pagination = toChangelogPagination(options.pagination)

  if (!pagination && !options.filter) {
    return undefined
  }

  return {
    pagination,
    filter: options.filter,
  }
}

export { ChangelogChangeType }
