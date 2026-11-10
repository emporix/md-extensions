import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import TableActions from '../shared/TableActions'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useCustomerApi } from '../../hooks/api/customers'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { getApiErrorDetails } from '../../helpers/api'
import {
  contactEditPath,
  customerAssignmentEditPath,
} from '../../constants/paths'
import type { ContactAssignment } from '../../models/LegalEntity.model'

type ContactActionsProps = {
  readonly contact: ContactAssignment
  readonly managerPermissions?: boolean
  readonly setSelectedContacts: (contacts: ContactAssignment[]) => void
  readonly selectedContacts: ContactAssignment[]
}

/**
 * Edit / delete row actions of a contact assignment. Deleting a CONTACT-type
 * assignment also deletes the contact (customer); a CUSTOMER-type assignment
 * is only unassigned.
 */
export const ContactActions = ({
  contact,
  managerPermissions = true,
  selectedContacts,
  setSelectedContacts,
}: ContactActionsProps) => {
  const { setRefreshValue } = useRefresh()
  const { i18n, t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { deleteContactAssignment } = useCustomerManagementApi()
  const { deleteCustomer } = useCustomerApi()
  const { showSuccess, showError } = useToast()

  const deleteContactCall = useCallback(async () => {
    try {
      await deleteContactAssignment(contact.id)
      if (contact.customer.id) await deleteCustomer(contact.customer.id)
      setSelectedContacts(selectedContacts?.filter((c) => c.id !== contact.id))
      setRefreshValue()
      showSuccess(t('contacts.toasts.deleteSuccess'))
    } catch (e: unknown) {
      showError(t('contacts.toasts.errorDelete'), getApiErrorDetails(e))
      console.error('Error deleting contact:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, contact.id, selectedContacts])

  const unassignCustomerCall = useCallback(async () => {
    try {
      await deleteContactAssignment(contact.id)
      setSelectedContacts(selectedContacts?.filter((c) => c.id !== contact.id))
      setRefreshValue()
      showSuccess(t('contacts.toasts.unassignSuccess'))
    } catch (e: unknown) {
      showError(t('contacts.toasts.errorDelete'), getApiErrorDetails(e))
      console.error('Error unassigning customer:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, contact.id, selectedContacts])

  return (
    <TableActions
      disabled={!managerPermissions}
      onEdit={() => {
        const companyId = String(contact.legalEntity?.id ?? '')
        if (contact.customer.type === 'CONTACT') {
          navigate(contactEditPath(companyId, contact.id))
        } else {
          navigate(customerAssignmentEditPath(companyId, contact.id))
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
    />
  )
}

export default ContactActions
