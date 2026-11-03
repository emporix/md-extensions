import { useCallback } from 'react'
import {
  getChangelogs,
  type ChangelogItem,
  type ChangelogPaginatedResponse,
  type ChangelogQueryOptions,
} from '@emporix/api-calls'
import { toChangelogPagination } from '../../helpers/auditLog/changelog.helpers'
import { useDashboardContext } from '../../context/Dashboard.context'
import type { PaginationProps } from '../usePagination'

export type PaginatedResponse<T> = ChangelogPaginatedResponse<T>

export const useChangelogApi = () => {
  const { tenant } = useDashboardContext()

  const getEntityChangelog = useCallback(
    async (
      entity: string,
      entityId: string,
      options?: { pagination?: Partial<PaginationProps> }
    ): Promise<ChangelogPaginatedResponse<ChangelogItem>> => {
      if (tenant) {
        return getChangelogs(tenant, {
          pagination: toChangelogPagination(options?.pagination),
          filter: { entity, entityId },
        })
      }
      return Promise.reject(new Error('No tenant'))
    },
    [tenant]
  )

  return { getEntityChangelog }
}

export type { ChangelogQueryOptions }
