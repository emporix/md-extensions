import { useCallback } from 'react'
import {
  listChangelogsWithCursorCall,
  type ChangelogEntry,
  type CursorPaginatedResponse,
  type ListChangelogsWithCursorParams,
} from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'

export type ChangelogCursor = Pick<
  ListChangelogsWithCursorParams,
  'next' | 'prev'
>

type ChangelogApi = {
  readonly getChangelogCursorPage: (
    q: string,
    rows: number,
    cursor: ChangelogCursor
  ) => Promise<CursorPaginatedResponse<ChangelogEntry>>
}

export const useChangelogApi = (): ChangelogApi => {
  const { tenant } = useDashboardContext()

  const getChangelogCursorPage = useCallback(
    async (
      q: string,
      rows: number,
      cursor: ChangelogCursor
    ): Promise<CursorPaginatedResponse<ChangelogEntry>> => {
      if (tenant) {
        return listChangelogsWithCursorCall(
          { pageSize: rows, q, ...cursor },
          { tenant }
        )
      }
      return Promise.reject(new Error('No tenant'))
    },
    [tenant]
  )

  return { getChangelogCursorPage }
}
