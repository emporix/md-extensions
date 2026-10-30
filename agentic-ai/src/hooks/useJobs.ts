import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { JobSummary } from '../types/Job'
import { useAppState } from '../contexts/AppStateContext'
import { JobService } from '../services/jobService'
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

export const useJobs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
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

  const { nextCursor, prevCursor, setCursors, resetCursor } =
    useCursorPagination()

  const jobService = useMemo(() => new JobService(appState), [appState])
  const agentId = getLogListAgentId(location.search)
  const listKey = `${agentId ?? ''}|${getNamespacedListKey(location.search, 'j')}`
  const cursor = readListCursor(location.search, 'j')
  const cursorKey = listCursorKey(cursor)
  const prevListKeyRef = useRef(listKey)
  const searchRef = useRef(location.search)
  searchRef.current = location.search
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname

  const replaceCursor = useCallback(
    (next: typeof cursor): boolean => {
      const nextSearch = writeListCursor(searchRef.current, 'j', next)
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

  const fetchJobs = useCallback(
    async (
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      currentAgentId?: string,
      newFilters?: Record<string, string>,
      requestCursor = readListCursor(searchRef.current, 'j')
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
          abandonListLoad({
            loadRequestIdRef,
            clearRows: () => setJobs([]),
            setLoading,
            setError,
            resetCursor,
          })
          if (!replaceCursor(null)) {
            setLoading(false)
          }
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
    [pageSize, filters, jobService, resetCursor, replaceCursor, setCursors, t]
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
    const requestCursor = readListCursor(searchRef.current, 'j')
    const listChanged = prevListKeyRef.current !== listKey
    prevListKeyRef.current = listKey

    setPageSize(query.jobs.rows)
    setSortBy(query.jobs.apiSortBy)
    setSortOrder(query.jobs.apiSortOrder)
    setFilters(query.jobs.apiFilters)

    if (listChanged && requestCursor) {
      abandonListLoad({
        loadRequestIdRef,
        clearRows: () => setJobs([]),
        setLoading,
        setError,
        resetCursor,
      })
      if (!replaceCursor(null)) {
        void fetchJobsRef.current(
          query.jobs.apiSortBy,
          query.jobs.apiSortOrder,
          query.jobs.rows,
          query.agentId,
          query.jobs.apiFilters,
          null
        )
      }
      return
    }

    fetchJobsRef.current(
      query.jobs.apiSortBy,
      query.jobs.apiSortOrder,
      query.jobs.rows,
      query.agentId,
      query.jobs.apiFilters,
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
