import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { LogSummary } from '../types/Log'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { useCursorPagination } from './useCursorPagination'

export const useAgentLogs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const [logs, setLogs] = useState<LogSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>('metadata.createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
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

  const fetchLogs = useCallback(
    async (
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      agentId?: string,
      newFilters?: Record<string, string>
    ) => {
      const requestId = ++loadRequestIdRef.current
      const requestCursor = cursor
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentFilters = newFilters !== undefined ? newFilters : filters
        const response = await logService.getAgentLogs(
          currentSortBy,
          currentSortOrder,
          currentPageSize,
          agentId,
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
    [pageSize, filters, logService, cursor, resetCursor, setCursors, t]
  )

  const refreshLogs = useCallback(
    (agentId?: string) => {
      return fetchLogs(sortBy, sortOrder, undefined, agentId, filters)
    },
    [fetchLogs, filters, sortBy, sortOrder]
  )

  const sortLogs = useCallback(
    (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
      resetCursor()
    },
    [resetCursor]
  )

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      if (JSON.stringify(filters) === JSON.stringify(newFilters)) {
        return
      }
      setFilters(newFilters)
      resetCursor()
    },
    [filters, resetCursor]
  )

  const changePageSize = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize)
      resetCursor()
    },
    [resetCursor]
  )

  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  const fetchLogsRef = useRef(fetchLogs)
  fetchLogsRef.current = fetchLogs

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    const parsedFilters = JSON.parse(filtersString) as Record<string, string>
    fetchLogsRef.current(
      sortBy,
      sortOrder,
      pageSize,
      agentIdParam || undefined,
      parsedFilters
    )
  }, [pageSize, cursorKey, location.search, filtersString, sortBy, sortOrder])

  return {
    logs,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    filters,
    refreshLogs,
    sortLogs,
    changePageSize,
    updateFilters,
    goNext,
    goPrevious,
  }
}
