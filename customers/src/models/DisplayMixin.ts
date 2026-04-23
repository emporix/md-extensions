import { SchemaAttributeType } from './Schema'
import { FilterMatchMode } from 'primereact/api'
import { LocalizedInput } from '../hooks/useLocalizedValue'
import Localized from './Localized.ts'

export type DisplayMixin = {
  key: string
  label: Localized
  type: SchemaAttributeType
}

export const parseColumnProps = (
  mixin: DisplayMixin,
  getContentLangValue: (Localized: LocalizedInput) => string
) => {
  return {
    columnKey: `mixins.${mixin.key}`,
    header: getContentLangValue(mixin.label),
    field: `mixins.${mixin.key}`,
    filterHeaderStyle: { minWidth: '250px' },
    filterPlaceholder: '',
    headerStyle: { width: '200px' },
    filter: true,
    sortable: true,
    showFilterMenu: false,
    showClearButton: true,
    filterMatchMode: FilterMatchMode.CONTAINS as any,
  }
}
