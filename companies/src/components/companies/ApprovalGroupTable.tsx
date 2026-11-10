import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import DropdownFilterTemplate from '../shared/DropdownFilter'
import { ApprovalGroupTableAction } from './ApprovalGroupTableAction'
import { useSelection } from '../contacts/SelectionValues.context'
import { useUIBlocker } from '../../context/UIBlocker'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import {
  ApprovalGroup,
  ContactType,
  LegalEntity,
} from '../../models/LegalEntity.model'
import styles from './ApprovalGroup.module.scss'

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

type ApprovalGroupTableProps = {
  readonly legalEntity: Partial<LegalEntity>
  readonly managerPermissions?: boolean
}

/** Contacts in the company's approval group, with row and batch remove. */
export const ApprovalGroupTable = ({
  legalEntity,
  managerPermissions = true,
}: ApprovalGroupTableProps) => {
  const { t, i18n } = useTranslation()
  const { selection, setSelection } = useSelection()
  const [isDeleting, setIsDeleting] = useState(false)
  const { blockPanel } = useUIBlocker()
  const { setRefreshValue } = useRefresh()
  const { removeApprovalGroupContact } = useCustomerManagementApi()

  // MD has no toast here: a failure only unblocks the panel.
  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      blockPanel(true)
      const idsToRemove = selection.map((item) => item.id)
      await removeApprovalGroupContact(legalEntity, idsToRemove)
      setSelection([])
      setRefreshValue()
    } finally {
      blockPanel(false)
      setIsDeleting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [selection])

  const getApprovalGroupAction = useCallback(
    (approvalGroup: ApprovalGroup) => (
      <ApprovalGroupTableAction
        managerPermissions={managerPermissions}
        approvalGroup={approvalGroup}
        legalEntity={legalEntity}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [legalEntity]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'name',
        header: t('companies.edit.form.policies.approvalGroup.columns.name'),
        filter: true,
        field: 'customer.name',
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'surname',
        header: t('companies.edit.form.policies.approvalGroup.columns.surname'),
        filter: true,
        field: 'customer.surname',
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'email',
        header: t('companies.edit.form.policies.approvalGroup.columns.email'),
        filter: true,
        field: 'customer.email',
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'type',
        header: t('contacts.contactType'),
        field: 'type',
        sortable: true,
        showFilterMenu: false,
        filter: true,
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, [
            // CL Dropdown has no `showClear` (MD); an explicit "All" clears.
            { value: '', label: t('global.all') },
            { value: ContactType.PRIMARY, label: t('contacts.type.primary') },
            { value: ContactType.CONTACT, label: t('contacts.type.contact') },
            {
              value: ContactType.LOGISTICS,
              label: t('contacts.type.logistics'),
            },
            { value: ContactType.BILLING, label: t('contacts.type.billing') },
          ]),
      },
      {
        columnKey: 'actions',
        body: (rowData: ApprovalGroup) => getApprovalGroupAction(rowData),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, legalEntity]
  )

  return (
    <>
      <BatchDeleteButton
        disabled={!managerPermissions}
        selected={selection}
        isDeleting={isDeleting}
        onDelete={batchDelete}
        pluralsPath="contacts"
      />
      <DataTable
        data-testid="approval-group-table"
        className={styles.table}
        dataKey="id"
        value={
          legalEntity.approvalGroup?.map(extendModelWithDisplayValues) || []
        }
        selection={selection}
        showFilter={true}
        onSelectionChange={(items: unknown) =>
          setSelection(items as ApprovalGroup[])
        }
        selectionMode="multiple"
        columns={columns}
      />
    </>
  )
}

export default ApprovalGroupTable
