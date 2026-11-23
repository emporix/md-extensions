import { useTranslation } from 'react-i18next'
import { Message } from '@emporix/component-library'
import { useSites } from '../../context/SitesProvider'
import {
  resolveMatchCountry,
  usesFallbackMatchCountry,
} from '../../hooks/useQuotesMatchPrices'
import { countUnpricedItems } from '../../helpers/quotePricing.helpers'
import { Quote } from '../../models/Quotes.model'

interface FallbackCountryNoticeProps {
  readonly quote: Quote | undefined
  readonly className?: string
}

/**
 * Says which country the prices were matched for when the quote has no
 * address, shown only while a product has no price: it may be priced for
 * another country (COP-7125).
 */
const FallbackCountryNotice = ({
  quote,
  className,
}: FallbackCountryNoticeProps) => {
  const { t } = useTranslation()
  const { sites } = useSites()
  if (!quote || !usesFallbackMatchCountry(quote)) return null
  if (countUnpricedItems(quote.items ?? []) === 0) return null
  const country = resolveMatchCountry(quote, sites)
  if (!country) return null
  return (
    <div className={className} data-testid="quote-fallback-country-notice">
      <Message
        severity="info"
        text={t('quotes.tabs.preview.fallbackCountryNotice', { country })}
      />
    </div>
  )
}

export default FallbackCountryNotice
