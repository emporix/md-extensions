import { useTranslation } from 'react-i18next'
import {
  Dialog,
  MoneyValue,
  SectionBox,
  SectionTitle,
} from '@emporix/component-library'
import LinkWithIcon from '../shared/LinkWithIcon'
import OrderSubOrders from './OrderSubOrders'
import { orderDetailPath } from '../../constants/paths'
import type { Order } from '../../models/Order.model'
import styles from './MasterOrderDialog.module.scss'

type MasterOrderDialogProps = {
  readonly order?: Order
  readonly visible?: boolean
  readonly onHide: () => void
}

const MasterOrderDialog = ({
  order,
  visible = false,
  onHide,
}: MasterOrderDialogProps) => {
  const { t, i18n } = useTranslation()
  if (!order) return null

  const columns = [
    {
      id: 'id',
      header: t('orders.tables.masterOrder.id'),
      value: <LinkWithIcon to={orderDetailPath(order.id)} label={order.id} />,
    },
    {
      id: 'name',
      header: t('orders.tables.masterOrder.name'),
      value:
        !order.customer?.firstName && !order.customer?.lastName
          ? '--'
          : `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}`,
    },
    {
      id: 'email',
      header: t('orders.tables.masterOrder.email'),
      value: order.customer?.email || '--',
    },
    {
      id: 'price',
      header: t('orders.tables.masterOrder.finalPrice'),
      value: (
        <MoneyValue
          currency={order.currency}
          value={order.calculatedPrice?.finalPrice?.grossValue}
          locale={i18n.language}
        />
      ),
    },
  ]

  return (
    <Dialog
      onHide={onHide}
      visible={visible}
      style={{ width: '80vw', maxWidth: '1400px' }}
    >
      <SectionBox
        className={styles.section}
        name={t('orders.labels.masterOrder')}
      >
        <div className={styles.row}>
          {columns.map((c) => (
            <div key={c.id} className={styles.cell}>
              <div className={styles.header}>{c.header}:</div>
              <div>{c.value}</div>
            </div>
          ))}
        </div>
      </SectionBox>
      <SectionTitle
        className={styles.title}
        name={t('orders.labels.subOrders')}
      />
      <OrderSubOrders subOrderIds={order.subOrders ?? []} />
    </Dialog>
  )
}

export default MasterOrderDialog
