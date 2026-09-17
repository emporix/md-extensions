import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { LogSummary } from '../types/Log'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { useCursorPagination } from './useCursorPagination'
import {
  getLogListAgentId,
  getNamespacedListKey,
  parseLogListQuery,
} from '../utils/logListQuery.helpers'

export const useAgentLogs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
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
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 'r')}`
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  const fetchLogs = useCallback(
    async (
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      currentAgentId?: string,
      newFilters?: Record<string, string>,
      requestCursor = cursorRef.current
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
          resetCursor()
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
    [pageSize, filters, logService, resetCursor, setCursors, t]
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
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.requests.rows)
    setSortBy(query.requests.apiSortBy)
    setSortOrder(query.requests.apiSortOrder)
    setFilters(query.requests.apiFilters)

    if (listChanged && cursorKey) {
      resetCursor()
      return
    }

    fetchLogsRef.current(
      query.requests.apiSortBy,
      query.requests.apiSortOrder,
      query.requests.rows,
      query.agentId,
      query.requests.apiFilters,
      listChanged ? null : cursorRef.current
    )
  }, [listKey, cursorKey, appState.tenant, appState.token, resetCursor])

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
