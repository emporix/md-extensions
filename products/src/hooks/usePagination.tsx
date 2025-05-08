import {
  DataTableFilterMetaData,
  DataTableFilterParams,
  DataTablePageParams,
  DataTableProps,
  DataTableSortParams,
} from 'primereact/datatable'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Metadata } from '../models/Metadata'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from './useLocalizedValue'
import { ColumnProps } from 'primereact/column'
import { FilterMatchMode } from 'primereact/api'

export interface PaginationProps extends DataTableProps {
  currentPage: number
}

export interface TableFilters {
  [key: string]: DataTableFilterMetaData
}

export interface PaginatedResponse<Type> {
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
  withQuery: boolean | undefined = true
) {
  const [paginationParams, setPaginationParams] = useState<
    Partial<PaginationProps>
  >(initialPaginationParams)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [searchParams, setSearchParams] = useSearchParams()

  const { i18n } = useTranslation()
  const { contentLanguage } = useLocalizedValue()

  useEffect(() => {
    setPaginationParams(initialPaginationParams)
  }, [i18n.language, contentLanguage])

  const onPageCallback = (event: DataTablePageParams) => {
    const { first, page, rows } = event
    initialPaginationParams.rows = rows
    setPaginationParams((pg) => ({
      ...pg,
      currentPage: (page as number) + 1,
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

  const onFilterCallback = (event: DataTableFilterParams) => {
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

  const onSortCallback = (event: DataTableSortParams) => {
    // if no sort field is selected, reset the sort order and field
    if (!event.sortField) {
      setPaginationParams({
        ...paginationParams,
        sortOrder: null,
        sortField: undefined,
      })
      return
    }

    // If clicking the same field, cycle through sort orders
    if (event.sortField === paginationParams.sortField) {
      if (
        paginationParams.sortOrder === null ||
        paginationParams.sortOrder === 0
      ) {
        // First click: ascending
        setPaginationParams({
          ...paginationParams,
          sortOrder: 1,
        })
      } else if (paginationParams.sortOrder === 1) {
        // Second click: descending
        setPaginationParams({
          ...paginationParams,
          sortOrder: -1,
        })
      } else {
        // Third click: no sort
        setPaginationParams({
          ...paginationParams,
          sortOrder: null,
          sortField: undefined,
        })
      }
    } else {
      // New field: start with ascending
      setPaginationParams({
        ...paginationParams,
        sortField: event.sortField,
        sortOrder: 1,
      })
    }
  }

  const resetPagination = () => {
    setPaginationParams(initialPaginationParams)
  }

  const isFiltersActive = (filters: TableFilters) => {
    return Object.keys(filters).some(
      (key) => filters[key].value !== undefined && filters[key].value !== null
    )
  }

  useEffect(() => {
    const currentPage = searchParams.get('page')
    const rows = searchParams.get('rows')
    if (currentPage && rows) {
      const rowsNum = parseInt(rows)
      const rowsCurrentPage = parseInt(currentPage)
      setPaginationParams({
        ...paginationParams,
        currentPage: rowsCurrentPage,
        rows: rowsNum,
        first: (rowsCurrentPage - 1) * rowsNum,
      })
    }
  }, [])

  useEffect(() => {
    const urlSearchParams = new URLSearchParams()
    const { currentPage, rows } = paginationParams
    if (currentPage && rows) {
      urlSearchParams.append('page', currentPage.toString())
      urlSearchParams.append('rows', rows.toString())
      if (withQuery) {
        setSearchParams(urlSearchParams)
      }
    }
  }, [paginationParams])

  const setFilters = (columns: ColumnProps[]) => {
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
