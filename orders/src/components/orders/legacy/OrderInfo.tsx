import { useTranslation } from 'react-i18next'
import { MoneyValue, SectionBox } from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import LinkWithIcon from '../../shared/LinkWithIcon'
import ExtendedOrderStatusSwitcher from '../ExtendedOrderStatusSwitcher'
import { getTotalAuthorizedAmount } from '../../../helpers/orders'
import { HOST_QUOTE_PATH } from '../../../constants/paths'
import type { Order } from '../../../models/Order.model'
import styles from './Legacy.module.scss'

const OrderInfo = ({ order }: { readonly order: Order }) => {
  const { t, i18n } = useTranslation()
  const money = (value: number | undefined, currency = order.currency) => (
    <MoneyValue currency={currency} value={value} locale={i18n.language} />
  )

  return (
    <SectionBox className={styles.section} name={t('orders.data.title.order')}>
      <div className={styles.fieldsWrap}>
        <LabeledValue label={t('orders.data.label.orderNo')}>
          {order.id}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.quoteNo')}>
          {order.quoteId ? (
            <LinkWithIcon
              className={styles.bold}
              label={order.quoteId}
              hostHref={HOST_QUOTE_PATH(order.quoteId)}
            />
          ) : (
            <span className={styles.bold}>--</span>
          )}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.status')}>
          {order.status}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.extendedOrderStatus')}>
          <ExtendedOrderStatusSwitcher order={order} />
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.payment')}>
          {order.payments?.[0]?.method}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.totalAuthorizedAmount')}>
          {money(getTotalAuthorizedAmount(order))}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.voucher')}>
          {money(order.discounts?.[0]?.amount, order.discounts?.[0]?.currency)}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.subtotal')}>
          {money(order.subTotalPrice)}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.delivery')}>
          {money(order.shipping?.total?.amount)}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.totalSum')}>
          {money(order.totalPrice)}
        </LabeledValue>
        {order.restriction && (
          <LabeledValue label={t('orders.data.label.restriction')}>
            {order.restriction}
          </LabeledValue>
        )}
      </div>
    </SectionBox>
  )
}

export default OrderInfo
