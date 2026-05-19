import {
  ApprovalGroup,
  ContactAssignment,
  ContactType,
  LegalEntity,
} from '../../models/LegalEntity'
import { useTranslation } from 'react-i18next'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import React, { useCallback, useMemo, useState } from 'react'
import { ApprovalGroupTableAction } from './ApprovalGroupTableAction'
import { useSelection } from '../../context/SelectionValuesProvider'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useRefresh } from '../../context/RefreshValuesProvider'
import MdDataTable from '../../components/MdDataTable'
import DropdownFilterTemplate from 'components/data-table/DropdownFilterTemplate'

const extendModelWithDisplayValues = (approvalGroup: ApprovalGroup) => {
  if (approvalGroup && approvalGroup.contact?.contactDetails) {
    const details = approvalGroup.contact?.contactDetails
    const { phones, emails } = details
    return {
      ...approvalGroup,
      contact: {
        ...approvalGroup.contact,
        contactDetails: {
          ...approvalGroup.contact.contactDetails,
          displayEmail: (emails && emails[0]) || '-',
          displayPhone: (phones && phones[0]) || '-',
        },
      },
    }
  }
  return approvalGroup
}

interface ApprovalGroupTableProps {
  legalEntity: Partial<LegalEntity>
  managerPermissions?: boolean
}

export const ApprovalGroupTable = (props: ApprovalGroupTableProps) => {
  const { legalEntity, managerPermissions = true } = props
  const { t, i18n } = useTranslation()
  const { selection, setSelection } = useSelection()
  const [isDeleting, setIsDeleting] = useState(false)
  const { blockPanel } = useUIBlocker()
  const { setRefreshValue } = useRefresh()
  const { removeApprovalGroupContact } = useCustomerManagementApi()

  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      blockPanel(true)
      const idsToRemove = selection.map(
        (contactAssignment: ContactAssignment) => contactAssignment.id
      )
      await removeApprovalGroupContact(legalEntity, idsToRemove)
      setSelection([])
      setRefreshValue()
    } finally {
      blockPanel(false)
      setIsDeleting(false)
    }
  }, [selection])

  const getApprovalGroupAction = useCallback(
    (approvalGroup: ApprovalGroup) => {
      return (
        <ApprovalGroupTableAction
          managerPermissions={managerPermissions}
          approvalGroup={approvalGroup}
          legalEntity={legalEntity}
        />
      )
    },
    [legalEntity]
  )
  const columns = useMemo(() => {
    return [
      {
        header: t(`companies.edit.form.policies.approvalGroup.columns.name`),
        filter: true,
        field: 'customer.name',
        sortable: true,
        showFilterMenu: false,
      },
      {
        header: t(`companies.edit.form.policies.approvalGroup.columns.surname`),
        filter: true,
        field: 'customer.surname',
        sortable: true,
        showFilterMenu: false,
      },
      {
        header: t(`companies.edit.form.policies.approvalGroup.columns.email`),
        filter: true,
        field: 'customer.email',
        sortable: true,
        showFilterMenu: false,
      },
      {
        header: t(`contacts.contactType`),
        field: 'type',
        sortable: true,
        showFilterMenu: false,
        filter: true,
        filterElement: (options: ColumnFilterElementTemplateOptions) =>
          DropdownFilterTemplate(options, [
            {
              value: ContactType.PRIMARY,
              label: t('contacts.type.primary'),
            },
            {
              value: ContactType.CONTACT,
              label: t('contacts.type.contact'),
            },
            {
              value: ContactType.LOGISTICS,
              label: t('contacts.type.logistics'),
            },
            {
              value: ContactType.BILLING,
              label: t('contacts.type.billing'),
            },
          ]),
      },
      {
        body: (rowData: ApprovalGroup) => getApprovalGroupAction(rowData),
      },
    ]
  }, [i18n.language, legalEntity])
  return (
    <>
      <BatchDeleteButton
        disabled={!managerPermissions}
        selected={selection}
        isDeleting={isDeleting}
        onDelete={batchDelete}
        pluralsPath={'contacts'}
      />
      <MdDataTable
        className={'mt-2'}
        value={
          legalEntity.approvalGroup?.map(extendModelWithDisplayValues) || []
        }
        selection={selection}
        showFilter={true}
        setSelectedItems={(e) => setSelection(e)}
        selectionMode="multiple"
      >
        {columns.map((column) => (
          <Column key={column.field} {...column}></Column>
        ))}
      </MdDataTable>
    </>
  )
}
