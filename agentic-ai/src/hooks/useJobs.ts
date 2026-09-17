import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { JobSummary } from '../types/Job'
import { useAppState } from '../contexts/AppStateContext'
import { JobService } from '../services/jobService'
import { useCursorPagination } from './useCursorPagination'
import {
  getLogListAgentId,
  getNamespacedListKey,
  parseLogListQuery,
} from '../utils/logListQuery.helpers'

export const useJobs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(
    () => parseLogListQuery(location.search).jobs.rows
  )
  const [filters, setFilters] = useState<Record<string, string>>(
    () => parseLogListQuery(location.search).jobs.apiFilters
  )
  const [sortBy, setSortBy] = useState<string>(
    () => parseLogListQuery(location.search).jobs.apiSortBy
  )
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(
    () => parseLogListQuery(location.search).jobs.apiSortOrder
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

  const jobService = useMemo(() => new JobService(appState), [appState])
  const agentId = getLogListAgentId(location.search)
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 'j')}`
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  const fetchJobs = useCallback(
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
        const response = await jobService.getJobs(
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
        setJobs(response.data)
        setCursors(response.nextCursor, response.prevCursor)
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(err instanceof Error ? err.message : t('failed_to_fetch_jobs'))
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [pageSize, filters, jobService, resetCursor, setCursors, t]
  )

  const refreshJobs = useCallback(
    (currentAgentId?: string) => {
      return fetchJobs(sortBy, sortOrder, undefined, currentAgentId, filters)
    },
    [fetchJobs, filters, sortBy, sortOrder]
  )

  const fetchJobsRef = useRef(fetchJobs)
  fetchJobsRef.current = fetchJobs

  useEffect(() => {
    const query = parseLogListQuery(searchRef.current)
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.jobs.rows)
    setSortBy(query.jobs.apiSortBy)
    setSortOrder(query.jobs.apiSortOrder)
    setFilters(query.jobs.apiFilters)

    if (listChanged && cursorKey) {
      resetCursor()
      return
    }

    fetchJobsRef.current(
      query.jobs.apiSortBy,
      query.jobs.apiSortOrder,
      query.jobs.rows,
      query.agentId,
      query.jobs.apiFilters,
      listChanged ? null : cursorRef.current
    )
  }, [listKey, cursorKey, appState.tenant, appState.token, resetCursor])

  return {
    jobs,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    refreshJobs,
    goNext,
    goPrevious,
  }
}
