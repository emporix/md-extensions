import {
  FilterMatchMode,
  type DataTableColumnProps,
  type DataTableFilterMeta,
} from '@emporix/component-library'
import type { ColumnVisibility } from '../models/Configuration.model'
import { parseColumnProps, type DisplayMixin } from '../models/DisplayMixin'
import type Localized from '../models/Localized.model'

export type ColumnFilterState = {
  value: string | null
  matchMode: FilterMatchMode
}

const storedFilterValue = (
  current: DataTableFilterMeta | undefined,
  columnKey: string
): string | null => {
  const existing = current?.[columnKey]
  if (!existing || typeof existing !== 'object' || !('value' in existing)) {
    return null
  }
  return typeof existing.value === 'string' ? existing.value : null
}

/**
 * Builds the table filter map from the current columns. A column that already
 * has a value keeps it, so rebuilding columns (for example when site options
 * refresh) does not clear an active filter.
 */
export const columnFiltersKeepingValues = (
  columns: DataTableColumnProps[],
  current: DataTableFilterMeta | undefined
): Record<string, ColumnFilterState> => {
  const filters: Record<string, ColumnFilterState> = {}
  columns
    .filter((column) => column.filter)
    .forEach((column) => {
      if (typeof column.columnKey !== 'string' || column.columnKey.length === 0) {
        return
      }
      filters[column.columnKey] = {
        value: storedFilterValue(current, column.columnKey),
        matchMode:
          (column.filterMatchMode as FilterMatchMode) ||
          FilterMatchMode.CONTAINS,
      }
    })
  return filters
}

/**
 * Applies persisted column visibility, appends configured mixin columns and an
 * optional trailing actions column. Ported from management-dashboard so tables
 * configured there keep rendering the same columns here.
 */
export const parseTableColumns = (
  rawColumns: DataTableColumnProps[],
  visibleColumns: ColumnVisibility[],
  visibleMixins: DisplayMixin[],
  getUiLangValue: (value: Localized | string | undefined) => string,
  setFilters: (columns: DataTableColumnProps[]) => void,
  actions?: DataTableColumnProps
): DataTableColumnProps[] => {
  const withVisibility = rawColumns.map((col) => {
    const columnVisibility = visibleColumns.find((c) => c.key === col.columnKey)
    // A column missing from the saved config was added after the user last
    // configured the table — show it by default.
    return {
      ...col,
      hidden: columnVisibility ? !columnVisibility.visible : false,
    }
  })

  const columns: DataTableColumnProps[] = [
    ...withVisibility,
    ...visibleMixins.map((mixin) => parseColumnProps(mixin, getUiLangValue)),
    ...(actions ? [actions] : []),
  ]

  setFilters(columns)

  return columns
}
