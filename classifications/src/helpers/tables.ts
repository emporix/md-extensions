import type { DataTableColumnProps } from '@emporix/component-library'
import type { ColumnVisibility } from '../models/Configuration.model'
import { parseColumnProps, type DisplayMixin } from '../models/DisplayMixin'
import type Localized from '../models/Localized.model'

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

/**
 * Expanded rows as Prime reports them: an `{ [id]: true }` map when the table
 * has a `dataKey`, otherwise the rows themselves.
 */
export type ExpandedRows<T> = T[] | Record<string, boolean>

/**
 * Ids of the expanded rows, in either shape. Ported from management-dashboard
 * (cart items, order entries).
 */
export const getExpandedIds = <T extends { id: string }>(
  expanded: ExpandedRows<T> | null | undefined
): Set<string> => {
  if (!expanded) return new Set()
  if (Array.isArray(expanded)) return new Set(expanded.map((row) => row.id))
  return new Set(Object.keys(expanded))
}
