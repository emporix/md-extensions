import React from 'react'
import { ContactAssignment } from 'models/LegalEntity'
import './Contact.scss'
import { Button } from 'primereact/button'
import { BsPencilFill } from 'react-icons/bs'
import { LabelValueCell } from './LabelValueCell'
import { formatCustomerName } from 'helpers/utils'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { usePermissions } from 'context/PermissionsProvider'
import { useTranslation } from 'react-i18next'
import { EmployeeDomains } from '../../configs/accessControls'

interface Props {
  contactAssignment: ContactAssignment
}

const Contact = (props: Props) => {
  const { contactAssignment } = props
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  return (
    <div className="contact grid grid-nogutter w-full align-items-center">
      <div className="type col-2">{contactAssignment.type}</div>
      <LabelValueCell
        className="col-3"
        label={t('companies.edit.form.primaryContacts.columns.name')}
        value={`${formatCustomerName(contactAssignment.customer)}`}
      />
      <LabelValueCell
        className="col-4"
        label={t('companies.edit.form.primaryContacts.columns.email')}
        value={
          contactAssignment.customer.email
            ? contactAssignment.customer.email
            : '--'
        }
      />
      <LabelValueCell
        className="col-2"
        label={t('companies.edit.form.primaryContacts.columns.phoneNumber')}
        value={
          contactAssignment.customer.phone
            ? contactAssignment.customer.phone
            : '--'
        }
      />
      <div className="flex justify-content-end col-1">
        <Button
          disabled={!canViewCustomers}
          className="p-button-text"
          icon={<BsPencilFill />}
          onClick={(e) => {
            e.preventDefault()
            const target =
              contactAssignment.customer.type === 'CONTACT'
                ? 'contact'
                : 'customer'
            navigate(
              `/apps/management/companies/${contactAssignment.legalEntity.id}/assignments/${target}/${contactAssignment.id}`
            )
          }}
        />
      </div>
    </div>
  )
}

export default Contact
