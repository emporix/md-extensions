import { useTranslation } from 'react-i18next'
import { Message, SectionBox } from '@emporix/component-library'
import OrderEntriesSummary from './OrderEntriesSummary'
import OrderEntriesList from './OrderEntriesList'
import { useOrderData } from '../../../contexts/OrderData.provider'
import {
  formatCurrency,
  getTotalAuthorizedAmount,
} from '../../../helpers/orders'
import { OrderStatus } from '../../../models/Order.model'
import styles from './OrderEntries.module.scss'

const OrderEntries = () => {
  const { t, i18n } = useTranslation()
  const { order } = useOrderData()
  if (!order) return null

  const totalAuthorizedAmount = getTotalAuthorizedAmount(order)
  const finalGross = order.calculatedPrice?.finalPrice?.grossValue
  const isTotalExceeded =
    totalAuthorizedAmount !== undefined &&
    finalGross !== undefined &&
    totalAuthorizedAmount < finalGross

  return (
    <>
      {order.status !== OrderStatus.COMPLETED && isTotalExceeded && (
        <Message
          className={styles.warning}
          severity="warn"
          text={t('orders.tables.entries.warning', {
            totalAuthorizedAmount: formatCurrency(
              order.currency,
              totalAuthorizedAmount,
              i18n.language
            ),
          })}
        />
      )}
      <SectionBox
        className={styles.summary}
        name={t('orders.forms.entries.header')}
      >
        <OrderEntriesSummary />
      </SectionBox>
      <OrderEntriesList order={order} />
    </>
  )
}

export default OrderEntries
