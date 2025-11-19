import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import { AppState } from '../types/common';

/**
 * Response structure for paginated API calls
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
}

/**
 * Fetch function signature for paginated data
 */
export type FetchFunction<T> = (
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC',
  pageSize?: number,
  pageNumber?: number,
  agentId?: string,
  filters?: Record<string, string>
) => Promise<PaginatedResponse<T>>;

/**
 * Generic hook for managing paginated data with sorting, filtering, and pagination
 * This hook reduces code duplication across useAgentLogs, useJobs, and useSessions
 * 
 * @param appState - Application state containing tenant and token
 * @param fetchFunction - Function to fetch paginated data
 * @param defaultSort - Default sort field
 * @param defaultSortOrder - Default sort order
 * @returns Paginated data state and management functions
 */
export const usePaginatedData = <T>(
  appState: AppState,
  fetchFunction: FetchFunction<T>,
  defaultSort: string = 'metadata.createdAt',
  defaultSortOrder: 'ASC' | 'DESC' = 'DESC'
) => {
  const location = useLocation();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  /**
   * Fetch data with optional parameters
   */
  const fetchData = useCallback(
    async (
      sortBy?: string,
      sortOrder?: 'ASC' | 'DESC',
      newPageSize?: number,
      newPageNumber?: number,
      agentId?: string,
      newFilters?: Record<string, string>
    ) => {
      try {
        setLoading(true);
        setError(null);
        const currentPageSize = newPageSize || pageSize;
        const currentPageNumber = newPageNumber || pageNumber;
        const currentFilters = newFilters !== undefined ? newFilters : filters;
        
        const response = await fetchFunction(
          sortBy,
          sortOrder,
          currentPageSize,
          currentPageNumber,
          agentId,
          currentFilters
        );
        
        setData(response.data);
        setTotalRecords(response.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, pageSize, pageNumber, filters]
  );

  /**
   * Refresh data with current parameters
   */
  const refresh = useCallback(
    (agentId?: string) => {
      return fetchData(defaultSort, defaultSortOrder, undefined, undefined, agentId, filters);
    },
    [fetchData, defaultSort, defaultSortOrder, filters]
  );

  /**
   * Sort data
   */
  const sort = useCallback(
    (sortBy: string, sortOrder: 'ASC' | 'DESC', agentId?: string) => {
      return fetchData(sortBy, sortOrder, undefined, undefined, agentId, filters);
    },
    [fetchData, filters]
  );

  /**
   * Update filters and reset to first page
   */
  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPageNumber(1);
  }, []);

  /**
   * Change page number
   */
  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber);
  }, []);

  /**
   * Change page size and reset to first page
   */
  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  // Create stable reference for filters to prevent unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  // Fetch data when dependencies change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    fetchData(
      defaultSort,
      defaultSortOrder,
      pageSize,
      pageNumber,
      agentIdParam || undefined,
      filters
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageNumber, appState.tenant, appState.token, location.search, filtersString]);

  return {
    data,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    filters,
    refresh,
    sort,
    changePage,
    changePageSize,
    updateFilters,
  };
};

