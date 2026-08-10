import {
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import Localized from './Localized.model'
import { SchemaAttributeType } from './Schema.model'
import { getValueFromPath } from '../helpers/tree'

/** A mixin surfaced as a table column, as configured in the table settings. */
export type DisplayMixin = {
  key: string
  label: Localized
  type: SchemaAttributeType
}

export const parseColumnProps = (
  mixin: DisplayMixin,
  getContentLangValue: (value: Localized | string | undefined) => string,
  filterable?: boolean
): DataTableColumnProps => ({
  columnKey: `mixins.${mixin.key}`,
  header: getContentLangValue(mixin.label),
  field: `mixins.${mixin.key}`,
  filterHeaderStyle: { minWidth: '250px' },
  headerStyle: { width: '200px' },
  filter: filterable ?? true,
  sortable: true,
  showFilterMenu: false,
  showClearButton: false,
  body: (row: unknown) => {
    const value = getValueFromPath(row, `mixins.${mixin.key}`)
    return (
      <div>
        {typeof value === 'boolean' || typeof value === 'object'
          ? JSON.stringify(value)
          : (value as string)}
      </div>
    )
  },
  filterMatchMode: FilterMatchMode.CONTAINS,
})
