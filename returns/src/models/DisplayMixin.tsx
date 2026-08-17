import {
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import DateValue from '../components/shared/DateValue'
import { DateFilterTemplate } from '../components/shared/DateFilterTemplate'
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
): DataTableColumnProps => {
  const isDateTime = mixin.type === SchemaAttributeType.DATE_TIME
  const isDate = mixin.type === SchemaAttributeType.DATE || isDateTime
  const filter = filterable ?? true

  const base: DataTableColumnProps = {
    columnKey: `mixins.${mixin.key}`,
    header: getContentLangValue(mixin.label),
    field: `mixins.${mixin.key}`,
    filterHeaderStyle: {
      minWidth: isDateTime ? '220px' : isDate ? '180px' : '250px',
    },
    headerStyle: { width: '200px' },
    filter,
    sortable: true,
    showFilterMenu: false,
    showClearButton: false,
  }

  if (isDate) {
    return {
      ...base,
      dataType: 'date',
      body: (row: unknown) => (
        <DateValue
          date={getValueFromPath(row, `mixins.${mixin.key}`) as string}
          showTime={isDateTime}
        />
      ),
      filterElement: (options: DataTableColumnFilterElementOptions) => (
        <DateFilterTemplate filterOptions={options} showTime={isDateTime} />
      ),
    }
  }

  return {
    ...base,
    filterMatchMode: FilterMatchMode.CONTAINS,
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
  }
}
