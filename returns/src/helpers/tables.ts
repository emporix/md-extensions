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
