import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateValue,
  type DataTableColumnProps,
} from '@emporix/component-library'
import LinkWithIcon from '../../components/shared/LinkWithIcon'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import { orderDetailPath } from '../../constants/paths'
import type { Order } from '../../models/Order.model'
import styles from './columns.module.scss'

const COLUMNS_PATH = 'orders.tables.suborders'

const useSubOrdersColumns = () => {
  const { i18n, t } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(() => {
    const cell = (label: string, value: ReactNode) => (
      <div className={styles.stackedCell}>
        <div className={styles.bold}>{label}</div>
        <div>{value}</div>
      </div>
    )
    return [
      { columnKey: 'expander', expander: true, style: { width: '3em' } },
      {
        columnKey: 'vendor',
        body: (o: Order) =>
          cell(t(`${COLUMNS_PATH}.vendor`), o.vendor?.name || '--'),
      },
      {
        columnKey: 'vendorId',
        body: (o: Order) =>
          cell(t(`${COLUMNS_PATH}.vendorId`), o.vendor?.id || '--'),
      },
      {
        columnKey: 'orderId',
        body: (o: Order) =>
          cell(
            t(`${COLUMNS_PATH}.orderId`),
            <LinkWithIcon to={orderDetailPath(o.id)} label={o.id} />
          ),
      },
      {
        columnKey: 'ordered',
        body: (o: Order) =>
          cell(
            t(`${COLUMNS_PATH}.ordered`),
            <DateValue date={o.created} locale={i18n.language} />
          ),
      },
      {
        columnKey: 'status',
        body: (o: Order) =>
          cell(t(`${COLUMNS_PATH}.status`), <OrderStatusBadge order={o} />),
      },
    ]
  }, [i18n.language, t])

  return { columns }
}

export default useSubOrdersColumns
