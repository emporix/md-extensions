import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@emporix/component-library'

/** MD's PrimeReact `Tag severity="warning"`; CL has no Tag (CL_WIDGET_STATUS). */
const PRICE_ON_REQUEST_COLOR = '#F59E0B'

/**
 * Marks a quote item without a price (COP-7125, MD `PriceOnRequestBadge` of
 * emporix/management-dashboard#1707).
 */
const PriceOnRequestBadge = () => {
  const { t } = useTranslation()
  return (
    <StatusBadge
      status={t('quotes.priceOnRequest')}
      color={PRICE_ON_REQUEST_COLOR}
    />
  )
}

export default PriceOnRequestBadge
