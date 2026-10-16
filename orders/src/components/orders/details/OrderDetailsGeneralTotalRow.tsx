import { useTranslation } from 'react-i18next'
import { MoneyValue, Skeleton, Tooltip } from '@emporix/component-library'
import { BsInfoCircle } from 'react-icons/bs'
import { useOrderData } from '../../../contexts/OrderData.provider'
import styles from './OrderDetails.module.scss'

const T_PATH = 'orders.forms.order.fields'

const RowValueCell = ({
  name,
  value,
}: {
  readonly name: string
  readonly value?: number
}) => {
  const { order } = useOrderData()
  const { i18n } = useTranslation()
  if (!order) return <Skeleton height="1rem" width="150px" />
  return (
    <div className={styles.totalValueWrapper}>
      <div className={styles.totalValue}>
        <span>{name}</span>
        <MoneyValue
          currency={order.currency}
          value={value}
          locale={i18n.language}
        />
      </div>
    </div>
  )
}

const OrderDetailsGeneralTotalRow = ({
  net,
  gross,
}: {
  readonly net?: number
  readonly gross?: number
}) => {
  const { t } = useTranslation()
  return (
    <div className={`${styles.row} ${styles.rowSummary}`}>
      <div className={styles.cell}>
        {t(`${T_PATH}.total`)}
        <Tooltip
          position="top"
          showDelay={200}
          content={t('orders.tooltips.authorizationAmount')}
        >
          <BsInfoCircle size={16} className={styles.infoIcon} />
        </Tooltip>
      </div>
      <div className={styles.cellEnd}>
        <RowValueCell name={t(`${T_PATH}.exclTax`)} value={net} />
      </div>
      <div className={styles.cellEnd}>
        <RowValueCell name={t(`${T_PATH}.inclTax`)} value={gross} />
      </div>
    </div>
  )
}

export default OrderDetailsGeneralTotalRow
