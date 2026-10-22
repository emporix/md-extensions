import { useTranslation } from 'react-i18next'
import { SectionBox } from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import { usePermissions } from '../../../context/PermissionsProvider'
import { EmployeeDomains } from '../../../configs/accessControls'
import { HOST_CUSTOMER_PATH } from '../../../constants/paths'
import type { OrderCustomer as Customer } from '../../../models/Order.model'
import styles from './Legacy.module.scss'

const OrderCustomer = ({ customer }: { readonly customer?: Customer }) => {
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const canViewCustomer = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  const customerId =
    customer?.id === 'ANONYMOUS' ? (
      t('orders.data.label.anonymous')
    ) : canViewCustomer && customer?.id ? (
      // Host-owned route, opened in a new tab like MD.
      <a
        target="_blank"
        href={HOST_CUSTOMER_PATH(customer.id)}
        rel="noreferrer"
      >
        {customer.id}
      </a>
    ) : (
      `${customer?.id}`
    )

  return (
    <SectionBox
      className={styles.section}
      name={t('orders.data.title.customer')}
    >
      <div className={styles.fieldsWrap}>
        <LabeledValue label={t('orders.data.label.customerId')}>
          {customerId}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.email')}>
          {customer?.email}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.customerName')}>
          {customer?.title} {customer?.name}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.birthday')}>
          {customer?.mixins?.generalAttributes?.birthday || '---'}
        </LabeledValue>
      </div>
    </SectionBox>
  )
}

export default OrderCustomer
