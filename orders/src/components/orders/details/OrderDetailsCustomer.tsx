import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OrderDetailsAddress from './OrderDetailsAddress'
import OrderDetailsField from './OrderDetailsField'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { useCustomerApi } from '../../../hooks/api/customers'
import type { Customer } from '../../../models/Customer.model'
import styles from './OrderDetails.module.scss'

const OrderDetailsCustomer = () => {
  const { t } = useTranslation()
  const { order } = useOrderData()
  const { syncCustomer } = useCustomerApi()
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true)
  const [customer, setCustomer] = useState<Customer>()
  const customerId = order?.customer?.id

  useEffect(() => {
    if (!order) return
    if (!customerId) {
      setIsLoadingCustomer(false)
      return
    }
    void (async () => {
      try {
        setIsLoadingCustomer(true)
        setCustomer(await syncCustomer(customerId))
      } catch (error) {
        console.error('Error fetching customer:', error)
      } finally {
        setIsLoadingCustomer(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, customerId])

  const orderCustomer = order?.customer

  return (
    <div className={styles.columns}>
      <div className={styles.columnNarrow}>
        {!orderCustomer && order ? (
          <div className={styles.muted}>{t('orders.labels.noCustomer')}</div>
        ) : (
          <div className={styles.stack}>
            <OrderDetailsField
              isLoading={!order}
              name={t('orders.forms.customer.fields.customerId')}
              value={orderCustomer?.id}
            />
            <OrderDetailsField
              isLoading={!order}
              name={t('orders.forms.customer.fields.email')}
              value={orderCustomer?.email}
            />
            <OrderDetailsField
              isLoading={!order}
              name={t('orders.forms.customer.fields.customerName')}
              value={`${orderCustomer?.firstName} ${orderCustomer?.lastName}`}
            />
          </div>
        )}
      </div>
      <div className={styles.divider} />
      <div className={styles.column}>
        <OrderDetailsAddress
          name={t('orders.forms.customer.fields.invoiceAddress')}
          address={order?.billingAddress}
          isLoading={!order}
        />
      </div>
      <OrderDetailsField
        alignEnd
        name={t('orders.forms.customer.fields.type')}
        isLoading={isLoadingCustomer}
        value={customer?.type}
      />
    </div>
  )
}

export default OrderDetailsCustomer
