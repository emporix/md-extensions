import type { DataTableColumnProps } from '@emporix/component-library'

export const numericColumn: Pick<
  DataTableColumnProps,
  'align' | 'bodyStyle' | 'headerStyle' | 'dataType'
> = {
  align: 'right',
  bodyStyle: { paddingRight: '12px' },
  headerStyle: { paddingRight: '12px' },
  dataType: 'numeric',
}
