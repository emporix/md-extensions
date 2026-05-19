import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCustomerManagementApi } from '../../api/customerManagement'
import {
  ContactAssignment,
  ContactType,
  LegalEntity,
} from '../../models/LegalEntity'
import { useTranslation } from 'react-i18next'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'
import { useSelection } from '../../context/SelectionValuesProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useRefresh } from '../../context/RefreshValuesProvider'
import BatchDeleteButton from '../../components/shared/BatchDeleteButton'
import { DotIndicator } from '../shared/DotIndicator'
import { ContactActions } from './ContactActions'
import MdDataTable from '../../components/MdDataTable'
import DropdownFilterTemplate from 'components/data-table/DropdownFilterTemplate'
import { FilterMatchMode } from 'primereact/api'
import { useToast } from '../../context/ToastProvider'

interface ContactAssignmentListProps {
  legalEntity: Partial<LegalEntity>
  managerPermissions?: boolean
}

export const ContactAssignmentList = (props: ContactAssignmentListProps) => {
  const { legalEntity, managerPermissions = true } = props
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

  const primaryOptions = useMemo(() => {
    return [
      { label: t('global.true'), value: 'true' },
      { label: t('global.false'), value: 'false' },
    ]
  }, [t])

  useEffect(() => {
    ;(async () => {
      if (!legalEntity.id) return

      try {
        const contactsForEntity = await getContactsForEntity(
          legalEntity.id as string
        )
        setContacts(contactsForEntity)
      } catch (e: any) {
        showError(
          t('contacts.toasts.errorLoad'),
          e.response.data.details || e.response.data.message
        )
        console.error('Error fetching contacts:', e)
      }
    })()
  }, [i18n.language, refresh, legalEntity.id])

  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      blockPanel(true)
      await Promise.all(
        selectedContacts.map((assignment: ContactAssignment) => {
          return deleteContactAssignment(assignment.id)
        })
      )
      setSelectedContacts([])
      setRefreshValue()
      showSuccess(t('contacts.toasts.deleteSuccess'))
    } catch (e: any) {
      showError(
        t('contacts.toasts.errorDelete'),
        e.response.data.details || e.response.data.message
      )
      console.error('Error during batch delete:', e)
    } finally {
      blockPanel(false)
      setIsDeleting(false)
    }
  }, [i18n.language, selectedContacts])

  const columns = useMemo(() => {
    return [
      {
        id: 'name',
        header: t('contacts.name'),
        field: 'customer.name',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        id: 'surname',
        header: t('contacts.surname'),
        field: 'customer.surname',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        id: 'primary',
        header: t(`contacts.primary`),
        filter: true,
        sortable: true,
        field: 'primary',
        showFilterMenu: false,
        showClearButton: false,
        matchMode: FilterMatchMode.EQUALS,
        body: (rowData: ContactAssignment) => (
          <DotIndicator value={rowData.primary} />
        ),
        filterElement: (options: ColumnFilterElementTemplateOptions) =>
          DropdownFilterTemplate(options, primaryOptions),
      },
      {
        id: 'contactType',
        header: t(`contacts.contactType`),
        field: 'type',
        sortable: true,
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
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
        id: 'userType',
        header: t(`contacts.assignment.userType`),
        field: 'customer.type',
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: ContactAssignment) => {
          return rowData.customer.type === 'CONTACT'
            ? t(`contacts.assignment.contactType`)
            : t(`contacts.assignment.customerType`)
        },
        filterElement: (options: ColumnFilterElementTemplateOptions) =>
          DropdownFilterTemplate(options, [
            {
              value: 'CONTACT',
              label: t(`contacts.assignment.contactType`),
            },
            {
              value: 'CUSTOMER',
              label: t(`contacts.assignment.customerType`),
            },
          ]),
      },
      {
        id: 'emailAddress',
        header: t(`contacts.emailAddress`),
        field: 'customer.email',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        matchMode: FilterMatchMode.CONTAINS,
        body: (rowData: ContactAssignment) => rowData.customer?.email,
      },
      {
        id: 'actions',
        body: (rowData: ContactAssignment) => {
          return (
            <ContactActions
              managerPermissions={managerPermissions}
              contact={rowData}
              setSelectedContacts={setSelectedContacts}
              selectedContacts={selectedContacts}
            />
          )
        },
      },
    ]
  }, [i18n.language, managerPermissions, selectedContacts])

  return (
    <>
      <BatchDeleteButton
        className="mb-2"
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
      <MdDataTable
        value={contacts}
        selection={selectedContacts}
        setSelectedItems={(c) => {
          setSelectedContacts(c)
          setSelection(c)
        }}
        selectionMode="multiple"
        columns={columns}
      />
    </>
  )
}
