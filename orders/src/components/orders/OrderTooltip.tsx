import { Tooltip } from '@emporix/component-library'
import { BsInfoCircle } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../helpers/orders'
import styles from './OrderTooltip.module.scss'

type OrderTooltipRowConfig = {
  id?: string
  label: string
  gross: number
  net: number
}

export type OrderTooltipConfig = {
  totalLabel: string
  totalGross: number
  totalNet: number
  items: OrderTooltipRowConfig[]
}

type OrderTooltipProps = {
  readonly display: boolean
  readonly currency: string
  readonly config: OrderTooltipConfig
}

const TooltipTable = ({
  config,
  currency,
}: Omit<OrderTooltipProps, 'display'>) => {
  const { t, i18n } = useTranslation()
  const money = (value: number) =>
    formatCurrency(currency, value, i18n.language)

  return (
    <div className={styles.table}>
      <div>
        <div className={styles.cell} />
        {config.items.map((item) => (
          <div key={`${item.id}-label`} className={styles.labelCell}>
            {item.label}
          </div>
        ))}
        <div className={`${styles.labelCell} ${styles.total}`}>
          {config.totalLabel}
        </div>
      </div>
      <div>
        <div className={styles.cell}>{t('global.net')}</div>
        {config.items.map((item) => (
          <div key={`${item.id}-net`} className={styles.cell}>
            {money(item.net)}
          </div>
        ))}
        <div className={`${styles.cell} ${styles.total}`}>
          {money(config.totalNet)}
        </div>
      </div>
      <div>
        <div className={styles.cell}>{t('global.gross')}</div>
        {config.items.map((item) => (
          <div key={`${item.id}-gross`} className={styles.cell}>
            {money(item.gross)}
          </div>
        ))}
        <div className={`${styles.cell} ${styles.total}`}>
          {money(config.totalGross)}
        </div>
      </div>
    </div>
  )
}

/** Info icon with a net/gross breakdown table (discounts, fees). */
const OrderTooltip = ({ display, config, currency }: OrderTooltipProps) => {
  if (!display) return null
  return (
    <Tooltip
      position="top"
      showDelay={200}
      content={<TooltipTable config={config} currency={currency} />}
    >
      <BsInfoCircle size={16} className={styles.icon} />
    </Tooltip>
  )
}

export default OrderTooltip
