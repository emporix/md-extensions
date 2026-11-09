import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import DropdownFilterTemplate from '../shared/DropdownFilter'
import { DotIndicator } from '../shared/DotIndicator'
import { ContactActions } from './ContactActions'
import { useSelection } from './SelectionValues.context'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useUIBlocker } from '../../context/UIBlocker'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { getApiErrorDetails } from '../../helpers/api'
import {
  ContactAssignment,
  ContactType,
  LegalEntity,
} from '../../models/LegalEntity.model'
import styles from './ContactAssignmentList.module.scss'

type ContactAssignmentListProps = {
  readonly legalEntity: Partial<LegalEntity>
  readonly managerPermissions?: boolean
}

/** Contact assignments of a company, with row and batch delete. */
export const ContactAssignmentList = ({
  legalEntity,
  managerPermissions = true,
}: ContactAssignmentListProps) => {
  const { i18n, t } = useTranslation()
  const { getContactsForEntity, deleteContactAssignment } =
    useCustomerManagementApi()
  const [selectedContacts, setSelectedContacts] = useState<ContactAssignment[]>(
    []
  )
  const { refresh, setRefreshValue } = useRefresh()
  const { setSelection } = useSelection()
  const [isDeleting, setIsDeleting] = useState(false)
  const [contacts, setContacts] = useState<ContactAssignment[]>([])
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError } = useToast()

  // CL Dropdown has no `showClear` (MD); an explicit "All" option clears.
  const allOption = useMemo(() => ({ label: t('global.all'), value: '' }), [t])

  const primaryOptions = useMemo(
    () => [
      allOption,
      { label: t('global.true'), value: 'true' },
      { label: t('global.false'), value: 'false' },
    ],
    [t, allOption]
  )

  useEffect(() => {
    void (async () => {
      if (!legalEntity.id) return

      try {
        const contactsForEntity = await getContactsForEntity(
          legalEntity.id as string
        )
        setContacts(contactsForEntity)
      } catch (e: unknown) {
        showError(t('contacts.toasts.errorLoad'), getApiErrorDetails(e))
        console.error('Error fetching contacts:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, refresh, legalEntity.id])

  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      blockPanel(true)
      await Promise.all(
        selectedContacts.map((assignment) =>
          deleteContactAssignment(assignment.id)
        )
      )
      setSelectedContacts([])
      setRefreshValue()
      showSuccess(t('contacts.toasts.deleteSuccess'))
    } catch (e: unknown) {
      showError(t('contacts.toasts.errorDelete'), getApiErrorDetails(e))
      console.error('Error during batch delete:', e)
    } finally {
      blockPanel(false)
      setIsDeleting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, selectedContacts])

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'name',
        header: t('contacts.name'),
        field: 'customer.name',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        columnKey: 'surname',
        header: t('contacts.surname'),
        field: 'customer.surname',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        // MD passes `matchMode`, which the Prime Column ignores, so the row
        // filter keeps its default match mode here too.
        columnKey: 'primary',
        header: t('contacts.primary'),
        filter: true,
        sortable: true,
        field: 'primary',
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: ContactAssignment) => (
          <DotIndicator value={rowData.primary} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, primaryOptions),
      },
      {
        columnKey: 'contactType',
        header: t('contacts.contactType'),
        field: 'type',
        sortable: true,
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, [
            allOption,
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
        columnKey: 'userType',
        header: t('contacts.assignment.userType'),
        field: 'customer.type',
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: ContactAssignment) =>
          rowData.customer.type === 'CONTACT'
            ? t('contacts.assignment.contactType')
            : t('contacts.assignment.customerType'),
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, [
            allOption,
            { value: 'CONTACT', label: t('contacts.assignment.contactType') },
            {
              value: 'CUSTOMER',
              label: t('contacts.assignment.customerType'),
            },
          ]),
      },
      {
        columnKey: 'emailAddress',
        header: t('contacts.emailAddress'),
        field: 'customer.email',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: ContactAssignment) => rowData.customer?.email,
      },
      {
        columnKey: 'actions',
        headerClassName: styles.actionsCell,
        body: (rowData: ContactAssignment) => (
          <ContactActions
            managerPermissions={managerPermissions}
            contact={rowData}
            setSelectedContacts={setSelectedContacts}
            selectedContacts={selectedContacts}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, managerPermissions, selectedContacts]
  )

  return (
    <>
      <BatchDeleteButton
        className={styles.batchDelete}
        disabled={!managerPermissions}
        selected={selectedContacts}
        onDelete={batchDelete}
        isDeleting={isDeleting}
        pluralsPath="contacts"
        singularName={
          [
            selectedContacts[0]?.customer?.name,
            selectedContacts[0]?.customer?.surname,
          ]
            .filter(Boolean)
            .join(' ') || selectedContacts[0]?.customer?.id
        }
      />
      <DataTable
        data-testid="contact-assignments-table"
        dataKey="id"
        value={contacts}
        selection={selectedContacts}
        onSelectionChange={(selection: unknown) => {
          const items = selection as ContactAssignment[]
          setSelectedContacts(items)
          setSelection(items)
        }}
        selectionMode="multiple"
        columns={columns}
      />
    </>
  )
}

export default ContactAssignmentList
