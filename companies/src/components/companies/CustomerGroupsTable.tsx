import React from 'react'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useTranslation } from 'react-i18next'
import { Column } from 'primereact/column'
import { CustomerGroupsTableProps } from '../../modules/CompaniesAddEdit.module'
import { CustomerGroupAction } from './CustomerGroupAction'
import MdDataTable from '../../components/MdDataTable'

export const CustomerGroupsTable = (props: CustomerGroupsTableProps) => {
  const { getContentLangValue } = useLocalizedValue()
  const { t } = useTranslation()
  return (
    <MdDataTable
      showFilter={false}
      value={props.legalEntity.customerGroups || []}
    >
      <Column
        header={t('companies.customerGroups.tableName')}
        field="name"
        body={(rowData) => getContentLangValue(rowData.name)}
        style={{ width: '90%' }}
      />
      <Column
        field="action"
        body={(rowData) => (
          <CustomerGroupAction
            customerGroupId={rowData.id}
            legalEntityId={props.legalEntity.id || ''}
          />
        )}
        style={{ width: '10%' }}
      />
    </MdDataTable>
  )
}
