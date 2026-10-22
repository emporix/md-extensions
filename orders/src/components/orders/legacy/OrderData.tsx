import { useTranslation } from 'react-i18next'
import { SectionBox } from '@emporix/component-library'
import OrderInfo from './OrderInfo'
import OrderCustomer from './OrderCustomer'
import OrderAddressSection from './OrderAddressSection'
import OrderInvoice from './OrderInvoice'
import DeliveryTimeForm from '../DeliveryTimeForm'
import OrderDocumentActions from '../OrderDocumentActions'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './Legacy.module.scss'

/** "Order data" tab for legacy orders (no `calculatedPrice`). */
const OrderData = () => {
  const { t } = useTranslation()
  const { order } = useOrderData()
  if (!order) return null

  return (
    <>
      <div className={styles.actionsRow}>
        <OrderDocumentActions order={order} />
      </div>
      <OrderInfo order={order} />
      <OrderCustomer customer={order.customer} />
      <OrderAddressSection
        title={t('orders.data.title.deliveryAddress')}
        address={order.shippingAddress}
      />
      <SectionBox
        className={styles.section}
        name={t('orders.data.title.deliveryInfo')}
      >
        <DeliveryTimeForm
          order={order}
          variant="inline"
          successToastKey="orders.toasts.successDeliveryDate"
          labels={{
            from: t('orders.data.label.from'),
            to: t('orders.data.label.to'),
            deliveryDate: t('orders.data.label.deliveryDate'),
            handover: t('orders.data.label.handover'),
          }}
        />
      </SectionBox>
      <OrderAddressSection
        title={t('orders.data.title.invoiceAddress')}
        address={order.billingAddress}
      />
      {order.mixins?.invoice && <OrderInvoice invoice={order.mixins.invoice} />}
    </>
  )
}

export default OrderData
