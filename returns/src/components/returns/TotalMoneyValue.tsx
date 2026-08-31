import { MoneyValue } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import styles from './TotalMoneyValue.module.scss'

interface TotalMoneyValueProps {
  value: number
  currency: string
  label?: string
  className?: string
}

const TotalMoneyValue = ({
  value,
  currency,
  label,
  className = '',
}: TotalMoneyValueProps) => {
  const { t, i18n } = useTranslation()

  return (
    <div className={[styles.total, className].filter(Boolean).join(' ')}>
      <div>{label ?? t('global.total')}:</div>
      <MoneyValue value={value} currency={currency} locale={i18n.language} />
    </div>
  )
}

export default TotalMoneyValue
