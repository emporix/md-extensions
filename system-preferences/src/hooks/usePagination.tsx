import {
  DataTableFilterMeta,
  DataTableFilterMetaData,
  DataTableFilterEvent,
  DataTablePageEvent,
  DataTableSortEvent,
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Metadata } from '../models/Metadata.model'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from './useLocalizedValue'

export type PaginationProps = {
  currentPage: number
  rows: number
  first: number
  sortOrder: 1 | 0 | -1 | null
  sortField?: string
  rowsPerPageOptions: number[]
  filters?: DataTableFilterMeta
  globalFilterFields?: string[]
  totalRecords?: number
}

export type TableFilters = {
  [key: string]: DataTableFilterMetaData
}

export type PaginatedResponse<Type> = {
  values: Type[]
  totalRecords: number
  metaData?: Metadata
}

export const DEFAULT_PAGINATION_PROPS: Partial<PaginationProps> = {
  currentPage: 1,
  rows: 10,
  first: 0,
  sortOrder: -1,
  sortField: undefined,
  rowsPerPageOptions: [10, 25, 50, 100],
}

export default function usePagination(
  initialPaginationParams: Partial<PaginationProps> = DEFAULT_PAGINATION_PROPS,
  withQuery: boolean | undefined = true,
  queryKeyPrefix?: string
) {
  const pageKey = queryKeyPrefix ? `${queryKeyPrefix}Page` : 'page'
  const rowsKey = queryKeyPrefix ? `${queryKeyPrefix}Rows` : 'rows'
  const initialPaginationParamsRef = useRef(initialPaginationParams)
  initialPaginationParamsRef.current = initialPaginationParams

  const [paginationParams, setPaginationParams] = useState<
    Partial<PaginationProps>
  >(() => ({
    ...DEFAULT_PAGINATION_PROPS,
    ...initialPaginationParamsRef.current,
  }))
  const [totalCount, setTotalCount] = useState<number>(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const setSearchParamsRef = useRef(setSearchParams)
  setSearchParamsRef.current = setSearchParams
  const isInitialMount = useRef(true)
  const isSyncingFromUrl = useRef(false)
  const isLanguageResetInitialMount = useRef(true)

  const { i18n } = useTranslation()
  const { contentLanguage } = useLocalizedValue()

  useEffect(() => {
    if (isLanguageResetInitialMount.current) {
      isLanguageResetInitialMount.current = false
      return
    }
    setPaginationParams({
      ...DEFAULT_PAGINATION_PROPS,
      ...initialPaginationParamsRef.current,
    })
  }, [i18n.language, contentLanguage])

  const onPageCallback = (event: DataTablePageEvent) => {
    const { first, page, rows } = event
    setPaginationParams((pg) => ({
      ...pg,
      currentPage: (page ?? 0) + 1,
      first,
      rows,
    }))
  }

  const clearEmptyFilters = (filters: TableFilters): TableFilters => {
    return Object.fromEntries(
      Object.entries(filters).map(([key, value]) =>
        value.value !== null &&
        typeof value.value === 'string' &&
        value.value === ''
          ? [key, { ...value, value: null }]
          : [key, value]
      )
    )
  }

  const onFilterCallback = (event: DataTableFilterEvent) => {
    const clearedFilters = clearEmptyFilters(event.filters as TableFilters)
    const newPaginationParams = {
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: isFiltersActive(event.filters as TableFilters)
        ? clearedFilters
        : undefined,
    }
    setPaginationParams(newPaginationParams)
  }

  const onSortCallback = (event: DataTableSortEvent) => {
    if (!event.sortField) {
      setPaginationParams({
        ...paginationParams,
        sortOrder: null,
        sortField: undefined,
      })
      return
    }

    if (event.sortField === paginationParams.sortField) {
      if (
        paginationParams.sortOrder === null ||
        paginationParams.sortOrder === 0
      ) {
        setPaginationParams({
          ...paginationParams,
          sortOrder: 1,
        })
      } else if (paginationParams.sortOrder === 1) {
        setPaginationParams({
          ...paginationParams,
          sortOrder: -1,
        })
      } else {
        setPaginationParams({
          ...paginationParams,
          sortOrder: null,
          sortField: undefined,
        })
      }
    } else {
      setPaginationParams({
        ...paginationParams,
        sortField: event.sortField,
        sortOrder: 1,
      })
    }
  }

  const resetPagination = () => {
    setPaginationParams({
      ...DEFAULT_PAGINATION_PROPS,
      ...initialPaginationParamsRef.current,
    })
  }

  const isFiltersActive = (filters: TableFilters) => {
    return Object.keys(filters).some(
      (key) => filters[key].value !== undefined && filters[key].value !== null
    )
  }

  useEffect(() => {
    if (!withQuery) {
      return
    }

    // Read the live URL rather than trusting `searchParams` directly — on a
    // fresh mount (e.g. right after a tab switch), react-router's own
    // location state can momentarily lag behind a `history.replaceState`
    // that already landed synchronously, which would otherwise sync this
    // component's pagination to stale page/rows left over from elsewhere.
    const liveSearchParams = new URLSearchParams(
      window.location.hash.split('?')[1] ?? ''
    )
    const pageStr = liveSearchParams.get(pageKey)
    const rowsStr = liveSearchParams.get(rowsKey)
    if (!pageStr || !rowsStr) {
      return
    }

    const rowsNum = parseInt(rowsStr, 10)
    const rowsCurrentPage = parseInt(pageStr, 10)
    if (Number.isNaN(rowsNum) || Number.isNaN(rowsCurrentPage)) {
      return
    }

    setPaginationParams((pagination) => {
      if (
        pagination.currentPage === rowsCurrentPage &&
        pagination.rows === rowsNum
      ) {
        return pagination
      }

      isSyncingFromUrl.current = true
      return {
        ...pagination,
        currentPage: rowsCurrentPage,
        rows: rowsNum,
        first: (rowsCurrentPage - 1) * rowsNum,
      }
    })
  }, [searchParams, withQuery, pageKey, rowsKey])

  useEffect(() => {
    if (!withQuery) {
      return
    }

    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false
      return
    }

    const { currentPage, rows } = paginationParams
    if (!currentPage || !rows) {
      return
    }

    const liveSearchParams = new URLSearchParams(
      window.location.hash.split('?')[1] ?? ''
    )
    if (
      liveSearchParams.get(pageKey) === currentPage.toString() &&
      liveSearchParams.get(rowsKey) === rows.toString()
    ) {
      return
    }

    setSearchParamsRef.current(
      () => {
        // Merge onto the live URL (not the `currentSearchParams` argument) —
        // that argument can be a stale per-hook snapshot when another
        // setSearchParams call (e.g. a tab change) lands in the same tick,
        // which would otherwise get silently reverted by this write.
        const currentSearchParams = new URLSearchParams(
          window.location.hash.split('?')[1] ?? ''
        )
        if (
          currentSearchParams.get(pageKey) === currentPage.toString() &&
          currentSearchParams.get(rowsKey) === rows.toString()
        ) {
          return currentSearchParams
        }
        const nextSearchParams = new URLSearchParams(currentSearchParams)
        nextSearchParams.set(pageKey, currentPage.toString())
        nextSearchParams.set(rowsKey, rows.toString())
        return nextSearchParams
      },
      { replace: true }
    )
  }, [paginationParams, withQuery, searchParams, pageKey, rowsKey])

  const setFilters = (columns: DataTableColumnProps[]) => {
    const filters: {
      [key: string]: {
        value: string | null
        matchMode: FilterMatchMode
      }
    } = {}
    columns
      .filter((column) => column.filter)
      .forEach((column) => {
        if (column.columnKey && typeof column.columnKey === 'string') {
          filters[column.columnKey] = {
            value: null,
            matchMode:
              (column.filterMatchMode as FilterMatchMode) ||
              FilterMatchMode.CONTAINS,
          }
        }
      })
    setPaginationParams({
      ...paginationParams,
      filters,
    })
  }

  return {
    onSortCallback,
    resetPagination,
    paginationParams,
    setPaginationParams,
    totalCount,
    setTotalCount,
    onPageCallback,
    onFilterCallback,
    setFilters,
  }
}
