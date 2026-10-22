import { useTranslation } from 'react-i18next'
import { SectionBox, SectionTitle } from '@emporix/component-library'
import OrderDetailsGeneral from './OrderDetailsGeneral'
import OrderDetailsCustomer from './OrderDetailsCustomer'
import OrderDetailsDelivery from './OrderDetailsDelivery'
import OrderDocumentActions from '../OrderDocumentActions'
import OrderSubOrders from '../OrderSubOrders'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './OrderDetails.module.scss'

/** "Order data" tab for orders priced by the calculation engine. */
const OrderDetails = () => {
  const { t } = useTranslation()
  const { order } = useOrderData()

  return (
    <>
      <SectionBox
        className={styles.section}
        name={t('orders.labels.order')}
        actions={order && <OrderDocumentActions order={order} />}
      >
        <OrderDetailsGeneral />
      </SectionBox>
      {order?.subOrders && order.subOrders.length > 0 && (
        <div className={styles.section}>
          <SectionTitle
            name={t('orders.labels.subOrders')}
            className={styles.sectionTitle}
          />
          <OrderSubOrders subOrderIds={order.subOrders} />
        </div>
      )}
      <SectionBox className={styles.section} name={t('orders.labels.customer')}>
        <OrderDetailsCustomer />
      </SectionBox>
      <SectionBox className={styles.section} name={t('orders.labels.delivery')}>
        <OrderDetailsDelivery />
      </SectionBox>
    </>
  )
}

export default OrderDetails
