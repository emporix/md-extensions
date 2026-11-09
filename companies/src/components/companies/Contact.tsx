import { BsPencilFill } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { ContactAssignment } from '../../models/LegalEntity.model'
import { LabelValueCell } from './LabelValueCell'
import { formatCustomerName } from '../../helpers/companyFormat.helpers'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import {
  contactEditPath,
  customerAssignmentEditPath,
} from '../../constants/paths'
import styles from './Contact.module.scss'

interface Props {
  readonly contactAssignment: ContactAssignment
}

const Contact = (props: Props) => {
  const { contactAssignment } = props
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  return (
    <div className={styles.contact} data-testid="primary-contact">
      <div className={styles.type}>{contactAssignment.type}</div>
      <LabelValueCell
        label={t('companies.edit.form.primaryContacts.columns.name')}
        value={`${formatCustomerName(contactAssignment.customer)}`}
      />
      <LabelValueCell
        label={t('companies.edit.form.primaryContacts.columns.email')}
        value={
          contactAssignment.customer.email
            ? contactAssignment.customer.email
            : '--'
        }
      />
      <LabelValueCell
        label={t('companies.edit.form.primaryContacts.columns.phoneNumber')}
        value={
          contactAssignment.customer.phone
            ? contactAssignment.customer.phone
            : '--'
        }
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.editButton}
          disabled={!canViewCustomers}
          aria-label={t('global.edit')}
          title={t('global.edit')}
          onClick={(e) => {
            e.preventDefault()
            const companyId = contactAssignment.legalEntity.id
            navigate(
              contactAssignment.customer.type === 'CONTACT'
                ? contactEditPath(companyId, contactAssignment.id)
                : customerAssignmentEditPath(companyId, contactAssignment.id)
            )
          }}
        >
          <BsPencilFill />
        </button>
      </div>
    </div>
  )
}

export default Contact
