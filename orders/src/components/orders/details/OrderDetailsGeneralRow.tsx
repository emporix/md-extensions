import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MoneyValue, Skeleton } from '@emporix/component-library'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './OrderDetails.module.scss'

type OrderDetailsGeneralRowProps = {
  readonly name?: ReactNode
  readonly gross?: number | string
  readonly net?: number | string
  readonly variant?: 'header' | 'bold'
  readonly className?: string
}

const RowValueCell = ({ value }: { readonly value?: number | string }) => {
  const { order } = useOrderData()
  const { i18n } = useTranslation()
  if (!order) return <Skeleton height="1rem" width="150px" />
  if (typeof value === 'number') {
    return (
      <MoneyValue
        currency={order.currency}
        value={value}
        locale={i18n.language}
      />
    )
  }
  return <span>{value || ''}</span>
}

const OrderDetailsGeneralRow = ({
  name,
  net,
  gross,
  variant,
  className = '',
}: OrderDetailsGeneralRowProps) => (
  <div
    className={[
      styles.row,
      variant === 'header' ? styles.rowHeader : '',
      variant === 'bold' ? styles.rowBold : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <div className={styles.cell}>{name}</div>
    <div className={styles.cellEnd}>
      <RowValueCell value={net} />
    </div>
    <div className={styles.cellEnd}>
      <RowValueCell value={gross} />
    </div>
  </div>
)

export default OrderDetailsGeneralRow
