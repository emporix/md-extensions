import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { CustomerGroup, LegalEntity } from '../../models/LegalEntity.model'
import { CustomerGroupAction } from './CustomerGroupAction'

export interface CustomerGroupsTableProps {
  readonly legalEntity: Partial<LegalEntity>
}

export const CustomerGroupsTable = (props: CustomerGroupsTableProps) => {
  const { getContentLangValue } = useLocalizedValue()
  const { t, i18n } = useTranslation()

  const columns = useMemo<DataTableColumnProps[]>(
    () => [
      {
        columnKey: 'name',
        header: t('companies.customerGroups.tableName'),
        field: 'name',
        body: (rowData: CustomerGroup) => getContentLangValue(rowData.name),
        style: { width: '90%' },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt per language
    [i18n.language, getContentLangValue]
  )

  return (
    <DataTable
      data-testid="customer-groups-table"
      dataKey="id"
      showFilter={false}
      value={props.legalEntity.customerGroups || []}
      columns={columns}
      rowActions={(rowData: CustomerGroup) => (
        <CustomerGroupAction customerGroupId={rowData.id} />
      )}
    />
  )
}
