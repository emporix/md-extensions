import React, { useCallback } from 'react'
import { ContactAssignment } from '../../models/LegalEntity'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useTranslation } from 'react-i18next'
import { useCustomerManagementApi } from '../../api/customerManagement'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useCustomerApi } from '../../api/customers'
import TableActions from '../shared/TableActions'
import { useToast } from '../../context/ToastProvider'

interface ContactActionsProps {
  contact: ContactAssignment
  managerPermissions?: boolean
  setSelectedContacts: (contacts: ContactAssignment[]) => void
  selectedContacts: ContactAssignment[]
}

export const ContactActions = (props: ContactActionsProps) => {
  const {
    contact,
    managerPermissions = true,
    selectedContacts,
    setSelectedContacts,
  } = props
  const { setRefreshValue } = useRefresh()
  const { i18n, t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { deleteContactAssignment } = useCustomerManagementApi()
  const { deleteCustomer } = useCustomerApi()
  const { showSuccess, showError } = useToast()

  const deleteContactCall = useCallback(async () => {
    try {
      await deleteContactAssignment(contact.id)
      if (contact.customer.id) await deleteCustomer(contact?.customer?.id)
      setSelectedContacts(selectedContacts?.filter((c) => c.id !== contact.id))
      setRefreshValue()
      showSuccess(t('contacts.toasts.deleteSuccess'))
    } catch (e: any) {
      showError(
        t('contacts.toasts.errorDelete'),
        e.response.data.details || e.response.data.message
      )
      console.error('Error deleting contact:', e)
    }
  }, [i18n.language, contact.id, selectedContacts])

  const unassignCustomerCall = useCallback(async () => {
    try {
      await deleteContactAssignment(contact.id)
      setSelectedContacts(selectedContacts?.filter((c) => c.id !== contact.id))
      setRefreshValue()
      showSuccess(t('contacts.toasts.unassignSuccess'))
    } catch (e: any) {
      showError(
        t('contacts.toasts.errorDelete'),
        e.response.data.details || e.response.data.message
      )
      console.error('Error unassigning customer:', e)
    }
  }, [i18n.language, contact.id, selectedContacts])

  return (
    <TableActions
      disabled={!managerPermissions}
      onEdit={() => {
        if (contact.customer.type === 'CONTACT') {
          navigate(
            `/apps/management/companies/${contact.legalEntity.id}/assignments/contact/${contact.id}`
          )
        } else {
          navigate(
            `/apps/management/companies/${contact.legalEntity.id}/assignments/customer/${contact.id}`
          )
        }
      }}
      onDelete={() =>
        contact.customer.type === 'CONTACT'
          ? deleteContactCall()
          : unassignCustomerCall()
      }
      deleteConfirm={{
        pluralsPath: 'contacts',
        entity: contact,
        entityLabel:
          [contact.customer?.name, contact.customer?.surname]
            .filter(Boolean)
            .join(' ') || contact.id,
      }}
    ></TableActions>
  )
}
