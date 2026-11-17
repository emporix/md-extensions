import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@emporix/component-library'
import { QuoteStatus, QuoteStatusColor } from '../../models/Quotes.model'

type QuoteStatusBadgeProps = {
  readonly status: QuoteStatus
  readonly className?: string
}

/**
 * Status badge with the status name of the Quotes user guide (COP-7116; MD
 * showed the API code) and MD's colour map. A status without a name shows its
 * API code.
 */
const QuoteStatusBadge = ({ status, className }: QuoteStatusBadgeProps) => {
  const { t } = useTranslation()
  return (
    <StatusBadge
      className={className}
      status={t(`quotes.status.${status}`, { defaultValue: status })}
      color={QuoteStatusColor[status]}
    />
  )
}

export default QuoteStatusBadge
