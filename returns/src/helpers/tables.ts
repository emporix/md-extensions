import {
  FilterMatchMode,
  type DataTableColumnProps,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
} from '@emporix/component-library'
import type { ColumnVisibility } from '../models/Configuration.model'
import { parseColumnProps, type DisplayMixin } from '../models/DisplayMixin'
import type Localized from '../models/Localized.model'

export type ColumnFilterState = {
  value: DataTableFilterMetaData['value'] | null
  matchMode: FilterMatchMode
}

const storedFilterValue = (
  current: DataTableFilterMeta | undefined,
  columnKey: string
): DataTableFilterMetaData['value'] | null => {
  const existing = current?.[columnKey]
  if (!existing || typeof existing !== 'object' || !('value' in existing)) {
    return null
  }
  return existing.value ?? null
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
 * Adds an exact site match to a copy of the current filters. A missing or
 * blank site code leaves the site out, so the list stays unfiltered. The
 * input map is left unchanged: column rebuilds drop a site key whose column
 * is not filterable, and the header selection is applied again here.
 */
export const withSiteEqualsFilter = (
  filters: DataTableFilterMeta | undefined,
  siteCode: string | undefined
): DataTableFilterMeta | undefined => {
  const rest: DataTableFilterMeta = { ...(filters ?? {}) }
  delete rest.siteCode
  const code = siteCode?.trim() ?? ''
  if (code.length === 0) {
    return Object.keys(rest).length === 0 ? undefined : rest
  }
  return {
    ...rest,
    siteCode: { value: code, matchMode: FilterMatchMode.EQUALS },
  }
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
