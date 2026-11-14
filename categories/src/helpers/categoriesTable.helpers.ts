import type { DataTableColumnProps } from '@emporix/component-library'
import type { ColumnVisibility } from '../models/Configuration.model'

/** Configuration key MD stores the categories column preference under. */
export const CATEGORIES_TABLE_KEY = 'ext_categories'

/**
 * The column toggles for the table settings, as MD `TableExtensions` builds
 * them: one per column in display order, labelled by its header, visible
 * unless a saved entry hides it.
 */
export const toColumnVisibility = (
  columns: DataTableColumnProps[],
  saved: ColumnVisibility[]
): ColumnVisibility[] =>
  columns.map((column) => {
    const key = String(column.columnKey ?? '')
    return {
      key,
      label: String(column.header ?? ''),
      visible: saved.find((entry) => entry.key === key)?.visible ?? true,
    }
  })
