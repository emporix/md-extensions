import { useTranslation } from 'react-i18next'
import { Message } from '@emporix/component-library'

interface UnpricedItemsWarningProps {
  readonly count: number
  readonly className?: string
}

/**
 * "Totals exclude n unpriced items" above the Preview table (COP-7125, MD
 * `UnpricedItemsWarning` of emporix/management-dashboard#1707).
 */
const UnpricedItemsWarning = ({
  count,
  className,
}: UnpricedItemsWarningProps) => {
  const { t } = useTranslation()
  if (count <= 0) return null
  return (
    <div className={className} data-testid="quote-unpriced-warning">
      <Message
        severity="warn"
        text={t('quotes.tabs.preview.unpricedWarning', { count })}
      />
    </div>
  )
}

export default UnpricedItemsWarning
