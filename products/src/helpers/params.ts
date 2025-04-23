import {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from 'primereact/datatable'
import { PaginationProps } from '../hooks/usePagination'
import { getDateFilter } from './date'

export const formatSortParam = (fieldName: string, order: number) => {
  return `${
    fieldName && fieldName.includes('[') ? fieldName.split('[')[0] : fieldName
  }:${order > 0 ? 'ASC' : 'DESC'}`
}

export const formatPaginationParamsForSorting = (
  paginationParams: Partial<PaginationProps>
) => {
  return paginationParams.sortField !== null &&
    paginationParams.sortField !== undefined
    ? formatSortParam(
        paginationParams.sortField,
        paginationParams.sortOrder as number
      )
    : undefined
}

export const formatPaginationParamsForEmporixPagination = (
  paginationParams: Partial<PaginationProps>
) => {
  return {
    pageNumber: (paginationParams.currentPage as number) || 1,
    pageSize: paginationParams.rows || 10,
  }
}

export const formatFilterQueryV2 = (
  filters?: DataTableFilterMeta | null
): string => {
  let filtersQuery = ''
  if (filters) {
    filtersQuery = Object.entries(filters)
      .map(([key, entry]) => {
        return [key, entry as DataTableFilterMetaData]
      })
      .filter(([, val]) => {
        return (
          (val as DataTableFilterMetaData).value !== null &&
          (val as DataTableFilterMetaData).value.toString().length > 0
        )
      })
      .reduce((prev, curr) => {
        const key = curr[0]
        const filter: DataTableFilterMetaData =
          curr[1] as DataTableFilterMetaData
        if (filter.matchMode === 'lt') {
          return `${prev} ${key}:<${filter.value}`
        } else if (filter.matchMode === 'lte') {
          return `${prev} ${key}:<=${filter.value}`
        } else if (filter.matchMode === 'gt') {
          return `${prev} ${key}:>${filter.value}`
        } else if (filter.matchMode === 'gte') {
          return `${prev} ${key}:>=${filter.value}`
        } else if (filter.matchMode === 'dateIs') {
          return `${prev} ${key}:${getDateFilter(filter.value)}`
        }
        return `${prev}${key}:~(${filter.value}) `
      }, filtersQuery)
  }
  return filtersQuery.trim()
}

export const formatFilterQuery = (
  filters?: DataTableFilterMeta | null
): string => {
  let filtersQuery = ''
  if (filters) {
    filtersQuery = Object.entries(filters)
      .map(([key, entry]) => {
        return [key, entry as DataTableFilterMetaData]
      })
      .filter(([, val]) => {
        return (
          (val as DataTableFilterMetaData).value !== null &&
          (val as DataTableFilterMetaData).value.toString().length > 0
        )
      })
      .reduce((prev, curr) => {
        const key = curr[0]
        const filter: DataTableFilterMetaData =
          curr[1] as DataTableFilterMetaData
        if (filter.matchMode === 'lt') {
          return `${prev} ${key}:<${filter.value}`
        } else if (filter.matchMode === 'lte') {
          return `${prev} ${key}:<=${filter.value}`
        } else if (filter.matchMode === 'gt') {
          return `${prev} ${key}:>${filter.value}`
        } else if (filter.matchMode === 'gte') {
          return `${prev} ${key}:>=${filter.value}`
        } else if (filter.matchMode === 'dateIs') {
          return `${prev} ${key}:${getDateFilter(filter.value)}`
        } else if (filter.matchMode === 'equals') {
          return `${prev} ${key}:${filter.value}`
        }
        return `${prev} ${key}:~(${filter.value})`
      }, filtersQuery)
  }
  return filtersQuery
}

export const formatFilterQueryParams = (
  filters?: DataTableFilterMeta | null
) => {
  const filteredQueryParams: Record<string, string | number> = {}
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const value = (filters[key] as DataTableFilterMetaData).value
      if (value !== undefined && value !== null) {
        filteredQueryParams[key] = (
          filters[key] as DataTableFilterMetaData
        ).value
      }
    })
  }

  return filteredQueryParams
}

export const formatPickListFilterQuery = (
  filters?: DataTableFilterMeta | null
) => {
  let filtersQuery = ''
  if (filters) {
    filtersQuery = Object.entries(filters)
      .map(([key, entry]) => {
        return [
          key.replaceAll('metadata.', ''),
          entry as DataTableFilterMetaData,
        ]
      })
      .filter(([, val]) => {
        return (
          (val as DataTableFilterMetaData).value !== null &&
          (val as DataTableFilterMetaData).value.toString().length > 0
        )
      })
      .reduce((prev, curr) => {
        const key = curr[0]
        const filter: DataTableFilterMetaData =
          curr[1] as DataTableFilterMetaData
        return `${prev} ${key}:${filter.value.replaceAll(' ', '%20')}`
      }, filtersQuery)
  }
  return filtersQuery
}
