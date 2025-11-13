import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import { AppState } from '../types/common';
import { LogService } from '../services/logService';
import { SessionLogs } from '../types/Log';

export const useSessions = (appState: AppState) => {
  const location = useLocation();
  const [sessions, setSessions] = useState<SessionLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const logService = new LogService(appState);

  const fetchSessions = useCallback(async (agentId: string, _sortBy?: string, _sortOrder?: 'ASC' | 'DESC', newPageSize?: number, newPageNumber?: number, newFilters?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const currentPageSize = newPageSize || pageSize;
      const currentPageNumber = newPageNumber || pageNumber;
      const currentFilters = newFilters !== undefined ? newFilters : filters;
      
      const response = await logService.getSessions(agentId || undefined, currentPageSize, currentPageNumber, currentFilters);
      
      setSessions(response.data);
      setTotalRecords(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token, pageSize, pageNumber, filters]);

  const refreshSessions = useCallback((agentId: string) => {
    return fetchSessions(agentId || '', undefined, undefined, undefined, undefined, filters);
  }, [fetchSessions, filters]);

  const sortSessions = useCallback((_sortBy: string, _sortOrder: 'ASC' | 'DESC', agentId: string) => {
    return fetchSessions(agentId || '', _sortBy, _sortOrder, undefined, undefined, filters);
  }, [fetchSessions, filters]);

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPageNumber(1); // Reset to first page when filters change
  }, []);

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  // Create stable reference for filters to prevent unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  // Fetch sessions when dependencies change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    fetchSessions(agentIdParam || '', 'metadata.modifiedAt', 'DESC', pageSize, pageNumber, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageNumber, appState.tenant, appState.token, location.search, filtersString]);

  return {
    sessions,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    filters,
    refreshSessions,
    sortSessions,
    changePage,
    changePageSize,
    updateFilters
  };
};
