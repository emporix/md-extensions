import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { CursorPaginatedResponse } from '@emporix/api-calls/next'
import { useDashboardContext } from '../context/Dashboard.context'
import {
  changelogWindowQ,
  type ChangelogScope,
  type ChangelogWindow,
} from '../helpers/auditLog/changelogWindow.helpers'
import type { ChangelogItem } from '../models/Changelog.model'
import { useChangelogApi, type ChangelogCursor } from './api/changelog'

export type ChangelogCursorPageStatus = 'idle' | 'loading' | 'ready' | 'error'

export type ChangelogCursorPage = {
  readonly items: ChangelogItem[]
  readonly status: ChangelogCursorPageStatus
  readonly nextCursor: string | null
  readonly prevCursor: string | null
  readonly goNext: () => void
  readonly goPrev: () => void
  readonly retry: () => void
}

type State = {
  readonly key: string
  readonly cursor: ChangelogCursor
  readonly attempt: number
  readonly status: ChangelogCursorPageStatus
  readonly items: ChangelogItem[]
  readonly nextCursor: string | null
  readonly prevCursor: string | null
}

type Action =
  | {
      readonly type: 'request'
      readonly key: string
      readonly cursor: ChangelogCursor
    }
  | {
      readonly type: 'loaded'
      readonly page: CursorPaginatedResponse<ChangelogItem>
    }
  | { readonly type: 'failed' }
  | { readonly type: 'navigate'; readonly cursor: ChangelogCursor }
  | { readonly type: 'retry' }

const FIRST_PAGE: ChangelogCursor = {}
const NO_ITEMS: ChangelogItem[] = []

const INITIAL_STATE: State = {
  key: '',
  cursor: FIRST_PAGE,
  attempt: 0,
  status: 'idle',
  items: NO_ITEMS,
  nextCursor: null,
  prevCursor: null,
}

const isAnchored = (cursor: ChangelogCursor): boolean =>
  cursor.next !== undefined || cursor.prev !== undefined

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'request':
      return action.key === state.key
        ? { ...state, cursor: action.cursor, status: 'loading' }
        : {
            ...INITIAL_STATE,
            key: action.key,
            cursor: action.cursor,
            attempt: state.attempt,
            status: 'loading',
          }
    case 'loaded':
      // Rows behind the cursor can disappear (a window edge, a compaction), so an empty page reached by cursor restarts from the first page
      if (action.page.values.length === 0 && isAnchored(state.cursor)) {
        return { ...state, cursor: FIRST_PAGE }
      }
      return {
        ...state,
        status: 'ready',
        items: action.page.values,
        nextCursor: action.page.nextCursor,
        prevCursor: action.page.prevCursor,
      }
    case 'failed':
      return { ...state, status: 'error' }
    case 'navigate':
      return { ...state, cursor: action.cursor }
    case 'retry':
      return { ...state, attempt: state.attempt + 1 }
  }
}

/**
 * One audit-log page read by cursor, always inside the window. A change of the
 * scope, the window, the rows or the tenant starts again from the first page,
 * because the API binds a cursor to the q and size it was issued for.
 */
const useChangelogCursorPage = (
  scope: ChangelogScope,
  window: ChangelogWindow,
  rows: number,
  options?: { readonly enabled?: boolean }
): ChangelogCursorPage => {
  const enabled = options?.enabled ?? true
  const { tenant } = useDashboardContext()
  const { getChangelogCursorPage } = useChangelogApi()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const q = useMemo(() => changelogWindowQ(scope, window), [scope, window])
  const key = JSON.stringify([tenant ?? '', rows, q])
  const ready = enabled && !!tenant
  const cursor = state.key === key ? state.cursor : FIRST_PAGE

  useEffect(() => {
    if (!ready) return

    let current = true
    dispatch({ type: 'request', key, cursor })
    getChangelogCursorPage(q, rows, cursor)
      .then((page) => {
        if (current) dispatch({ type: 'loaded', page })
      })
      .catch((error) => {
        if (!current) return
        console.error(error)
        dispatch({ type: 'failed' })
      })
    return () => {
      current = false
    }
  }, [ready, key, cursor, q, rows, state.attempt, getChangelogCursorPage])

  // Until the effect sends the request for a new key, the state still holds the previous key's page
  const isCurrent = state.key === key
  const items = isCurrent ? state.items : NO_ITEMS
  const nextCursor = isCurrent ? state.nextCursor : null
  const prevCursor = isCurrent ? state.prevCursor : null
  let status: ChangelogCursorPageStatus = 'idle'
  if (isCurrent) {
    status = state.status
  } else if (ready) {
    status = 'loading'
  }

  const goNext = useCallback(() => {
    if (status !== 'loading' && nextCursor) {
      dispatch({ type: 'navigate', cursor: { next: nextCursor } })
    }
  }, [status, nextCursor])

  const goPrev = useCallback(() => {
    if (status !== 'loading' && prevCursor) {
      dispatch({ type: 'navigate', cursor: { prev: prevCursor } })
    }
  }, [status, prevCursor])

  const retry = useCallback(() => dispatch({ type: 'retry' }), [])

  return {
    items,
    status,
    nextCursor,
    prevCursor,
    goNext,
    goPrev,
    retry,
  }
}

export default useChangelogCursorPage
