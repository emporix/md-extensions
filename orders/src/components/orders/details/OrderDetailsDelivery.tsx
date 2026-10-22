import { useTranslation } from 'react-i18next'
import { Skeleton } from '@emporix/component-library'
import OrderDetailsAddress from './OrderDetailsAddress'
import DeliveryTimeForm from '../DeliveryTimeForm'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './OrderDetails.module.scss'

const T_PATH = 'orders.forms.delivery.fields'

const OrderDetailsDelivery = () => {
  const { t } = useTranslation()
  const { order } = useOrderData()

  return (
    <div className={styles.columns}>
      <div className={styles.columnNarrow}>
        {order ? (
          <DeliveryTimeForm
            order={order}
            variant="stacked"
            successToastKey="orders.toasts.successDeliveryDate"
            labels={{
              from: t(`${T_PATH}.from`),
              to: t(`${T_PATH}.to`),
              deliveryDate: t(`${T_PATH}.deliveryDate`),
              handover: t(`${T_PATH}.handover`),
            }}
          />
        ) : (
          <div className={styles.stack}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeleton}>
                <Skeleton width="5rem" />
                <Skeleton width="10rem" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.divider} />
      <div className={styles.column}>
        <OrderDetailsAddress
          isLoading={!order}
          name={t(`${T_PATH}.shippingAddress`)}
          address={order?.shippingAddress}
        />
      </div>
    </div>
  )
}

export default OrderDetailsDelivery
