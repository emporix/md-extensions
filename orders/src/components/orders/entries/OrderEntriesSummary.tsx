import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MoneyValue } from '@emporix/component-library'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './OrderEntriesSummary.module.scss'

const SummaryTile = ({
  name,
  value,
}: {
  readonly name: string
  readonly value: ReactNode
}) => (
  <div
    className={styles.tile}
    data-testid={`orders-entries-orders-items-${name}`}
  >
    <div className={styles.bold}>{name || '--'}</div>
    <div className={styles.bold}>{value || '--'}</div>
  </div>
)

const OrderEntriesSummary = () => {
  const { t, i18n } = useTranslation()
  const { order } = useOrderData()
  const finalPrice = order?.entries?.reduce(
    (acc, item) => acc + (item.calculatedPrice?.finalPrice?.grossValue || 0),
    0
  )

  return (
    <div className={styles.summary}>
      <div className={styles.half}>
        <SummaryTile
          name={t('orders.forms.entries.fields.totalOrderedItems')}
          value={order?.entries?.length || 0}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.half}>
        <SummaryTile
          name={t('orders.forms.entries.fields.finalPrice')}
          value={
            <MoneyValue
              value={finalPrice}
              currency={order?.currency}
              locale={i18n.language}
            />
          }
        />
      </div>
    </div>
  )
}

export default OrderEntriesSummary
