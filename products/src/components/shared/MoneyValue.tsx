import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../helpers/utils'

interface MoneyValueProps {
  className: string
  currency: string
  value: number | undefined
  nullText: string
}

const MoneyValue = (props: MoneyValueProps) => {
  const { className, currency, value, nullText } = props
  const { i18n } = useTranslation()
  const [showNullText, setShowNullText] = useState<boolean>(false)
  const [moneyText, setMoneyText] = useState<string>('')

  useEffect(() => {
    if (value === undefined || !currency) {
      setShowNullText(true)
    } else {
      const formattedMoney = formatCurrency(currency, value)
      if (formattedMoney === '--') {
        setShowNullText(true)
      } else {
        setMoneyText(formattedMoney)
        setShowNullText(false)
      }
    }
  }, [i18n.language, value, currency])

  return <div className={className}>{showNullText ? nullText : moneyText}</div>
}

MoneyValue.defaultProps = {
  className: '',
  nullText: '--',
}

export default MoneyValue
