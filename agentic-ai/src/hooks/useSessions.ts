import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { SessionLogs } from '../types/Log'
import { useCursorPagination } from './useCursorPagination'
import {
  getLogListAgentId,
  getNamespacedListKey,
  parseLogListQuery,
} from '../utils/logListQuery.helpers'

export const useSessions = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
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

  const {
    cursor,
    nextCursor,
    prevCursor,
    setCursors,
    resetCursor,
    goNext,
    goPrevious,
    cursorKey,
  } = useCursorPagination()

  const logService = useMemo(() => new LogService(appState), [appState])
  const agentId = getLogListAgentId(location.search)
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 's')}`
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  const fetchSessions = useCallback(
    async (
      currentAgentId: string,
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      newFilters?: Record<string, string>,
      requestCursor = cursorRef.current
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
          resetCursor()
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
    [pageSize, filters, logService, resetCursor, setCursors, t]
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
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.sessions.rows)
    setSortBy(query.sessions.apiSortBy)
    setSortOrder(query.sessions.apiSortOrder)
    setFilters(query.sessions.apiFilters)

    if (listChanged && cursorKey) {
      resetCursor()
      return
    }

    fetchSessionsRef.current(
      query.agentId || '',
      query.sessions.apiSortBy,
      query.sessions.apiSortOrder,
      query.sessions.rows,
      query.sessions.apiFilters,
      listChanged ? null : cursorRef.current
    )
  }, [listKey, cursorKey, appState.tenant, appState.token, resetCursor])

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
