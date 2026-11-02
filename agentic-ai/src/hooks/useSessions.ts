import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { SessionLogs } from '../types/Log'
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

export const useSessions = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionLogs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(
    () => parseLogListQuery(location.search).sessions.rows
  )
  const [filters, setFilters] = useState<Record<string, string>>(
    () => parseLogListQuery(location.search).sessions.apiFilters
  )
  const [sortBy, setSortBy] = useState<string>(
    () => parseLogListQuery(location.search).sessions.apiSortBy
  )
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(
    () => parseLogListQuery(location.search).sessions.apiSortOrder
  )
  const loadRequestIdRef = useRef(0)

  const { nextCursor, prevCursor, setCursors, resetCursor } =
    useCursorPagination()

  const logService = useMemo(() => new LogService(appState), [appState])
  const agentId = getLogListAgentId(location.search)
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 's')}`
  const cursor = readListCursor(location.search, 's')
  const cursorKey = listCursorKey(cursor)
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname

  const replaceCursor = useCallback(
    (next: typeof cursor): boolean => {
      const nextSearch = writeListCursor(searchRef.current, 's', next)
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

  const fetchSessions = useCallback(
    async (
      currentAgentId: string,
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      newFilters?: Record<string, string>,
      requestCursor = readListCursor(searchRef.current, 's')
    ) => {
      const requestId = ++loadRequestIdRef.current
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentFilters = newFilters !== undefined ? newFilters : filters

        const response = await logService.getSessions(
          currentAgentId || undefined,
          currentPageSize,
          currentFilters,
          currentSortBy,
          currentSortOrder,
          requestCursor
        )

        if (requestId !== loadRequestIdRef.current) return
        if (requestCursor && response.data.length === 0) {
          abandonListLoad({
            loadRequestIdRef,
            clearRows: () => setSessions([]),
            setLoading,
            setError,
            resetCursor,
          })
          if (!replaceCursor(null)) {
            setLoading(false)
          }
          return
        }
        setSessions(response.data)
        setCursors(response.nextCursor, response.prevCursor)
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(
          err instanceof Error ? err.message : t('failed_to_fetch_sessions')
        )
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [pageSize, filters, logService, resetCursor, replaceCursor, setCursors, t]
  )

  const refreshSessions = useCallback(
    (currentAgentId: string) => {
      return fetchSessions(
        currentAgentId || '',
        sortBy,
        sortOrder,
        undefined,
        filters
      )
    },
    [fetchSessions, filters, sortBy, sortOrder]
  )

  const fetchSessionsRef = useRef(fetchSessions)
  fetchSessionsRef.current = fetchSessions

  useEffect(() => {
    const query = parseLogListQuery(searchRef.current)
    const requestCursor = readListCursor(searchRef.current, 's')
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.sessions.rows)
    setSortBy(query.sessions.apiSortBy)
    setSortOrder(query.sessions.apiSortOrder)
    setFilters(query.sessions.apiFilters)

    if (listChanged && requestCursor) {
      abandonListLoad({
        loadRequestIdRef,
        clearRows: () => setSessions([]),
        setLoading,
        setError,
        resetCursor,
      })
      if (!replaceCursor(null)) {
        void fetchSessionsRef.current(
          query.agentId || '',
          query.sessions.apiSortBy,
          query.sessions.apiSortOrder,
          query.sessions.rows,
          query.sessions.apiFilters,
          null
        )
      }
      return
    }

    fetchSessionsRef.current(
      query.agentId || '',
      query.sessions.apiSortBy,
      query.sessions.apiSortOrder,
      query.sessions.rows,
      query.sessions.apiFilters,
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
    sessions,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    refreshSessions,
    goNext,
    goPrevious,
  }
}
