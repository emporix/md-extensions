import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { LogSummary } from '../types/Log'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { useCursorPagination } from './useCursorPagination'
import { abandonListLoad } from '../utils/listLoad.helpers'
import {
  getLogListAgentId,
  getNamespacedListKey,
  listCursorKey,
  parseLogListQuery,
  readListCursor,
  writeListCursor,
} from '../utils/logListQuery.helpers'

export const useAgentLogs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<LogSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(
    () => parseLogListQuery(location.search).requests.rows
  )
  const [filters, setFilters] = useState<Record<string, string>>(
    () => parseLogListQuery(location.search).requests.apiFilters
  )
  const [sortBy, setSortBy] = useState<string>(
    () => parseLogListQuery(location.search).requests.apiSortBy
  )
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(
    () => parseLogListQuery(location.search).requests.apiSortOrder
  )
  const loadRequestIdRef = useRef(0)

  const { nextCursor, prevCursor, setCursors, resetCursor } =
    useCursorPagination()

  const logService = useMemo(() => new LogService(appState), [appState])
  const agentId = getLogListAgentId(location.search)
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 'r')}`
  const cursor = readListCursor(location.search, 'r')
  const cursorKey = listCursorKey(cursor)
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname

  const replaceCursor = useCallback(
    (next: typeof cursor): boolean => {
      const nextSearch = writeListCursor(searchRef.current, 'r', next)
      if (nextSearch === (searchRef.current || '')) {
        return false
      }
      navigate(
        { pathname: pathnameRef.current, search: nextSearch },
        { replace: true }
      )
      return true
    },
    [navigate]
  )

  const fetchLogs = useCallback(
    async (
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      currentAgentId?: string,
      newFilters?: Record<string, string>,
      requestCursor = readListCursor(searchRef.current, 'r')
    ) => {
      const requestId = ++loadRequestIdRef.current
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentFilters = newFilters !== undefined ? newFilters : filters
        const response = await logService.getAgentLogs(
          currentSortBy,
          currentSortOrder,
          currentPageSize,
          currentAgentId,
          currentFilters,
          requestCursor
        )
        if (requestId !== loadRequestIdRef.current) return
        if (requestCursor && response.data.length === 0) {
          abandonListLoad({
            loadRequestIdRef,
            clearRows: () => setLogs([]),
            setLoading,
            setError,
            resetCursor,
          })
          if (!replaceCursor(null)) {
            setLoading(false)
          }
          return
        }
        setLogs(response.data)
        setCursors(response.nextCursor, response.prevCursor)
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(err instanceof Error ? err.message : t('failed_to_fetch_logs'))
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [pageSize, filters, logService, resetCursor, replaceCursor, setCursors, t]
  )

  const refreshLogs = useCallback(
    (currentAgentId?: string) => {
      return fetchLogs(sortBy, sortOrder, undefined, currentAgentId, filters)
    },
    [fetchLogs, filters, sortBy, sortOrder]
  )

  const fetchLogsRef = useRef(fetchLogs)
  fetchLogsRef.current = fetchLogs

  useEffect(() => {
    const query = parseLogListQuery(searchRef.current)
    const requestCursor = readListCursor(searchRef.current, 'r')
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.requests.rows)
    setSortBy(query.requests.apiSortBy)
    setSortOrder(query.requests.apiSortOrder)
    setFilters(query.requests.apiFilters)

    if (listChanged && requestCursor) {
      abandonListLoad({
        loadRequestIdRef,
        clearRows: () => setLogs([]),
        setLoading,
        setError,
        resetCursor,
      })
      if (!replaceCursor(null)) {
        void fetchLogsRef.current(
          query.requests.apiSortBy,
          query.requests.apiSortOrder,
          query.requests.rows,
          query.agentId,
          query.requests.apiFilters,
          null
        )
      }
      return
    }

    fetchLogsRef.current(
      query.requests.apiSortBy,
      query.requests.apiSortOrder,
      query.requests.rows,
      query.agentId,
      query.requests.apiFilters,
      requestCursor
    )
  }, [
    listKey,
    cursorKey,
    appState.tenant,
    appState.token,
    replaceCursor,
    resetCursor,
  ])

  const goNext = useCallback(() => {
    if (!nextCursor) {
      return
    }
    replaceCursor({ next: nextCursor })
  }, [nextCursor, replaceCursor])

  const goPrevious = useCallback(() => {
    if (!prevCursor) {
      return
    }
    replaceCursor({ prev: prevCursor })
  }, [prevCursor, replaceCursor])

  return {
    logs,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    refreshLogs,
    goNext,
    goPrevious,
  }
}
