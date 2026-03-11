import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastQuotes } from '../../hooks/useLastQuotes'
import {
  formatQuoteDateForTimeline,
  getQuoteCustomerDisplayName,
  formatQuoteTotal,
  getQuoteCreated,
} from '../../helpers/quote.helpers'
import {
  TimelineWidget,
  type TimelineEntry,
} from '../../components/TimelineWidget'
import { ROUTES } from '../../data/routes'

const DISPLAY_COUNT = 10

export const LastQuotesTimelineWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { quotes, loading, error } = useLastQuotes(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const entries: TimelineEntry[] = useMemo(() => {
    const now = new Date()
    return quotes.slice(0, DISPLAY_COUNT).map((quote) => {
      const customerName = getQuoteCustomerDisplayName(quote)
      return {
        id: quote.id,
        dateLabel: formatQuoteDateForTimeline(getQuoteCreated(quote), now, t),
        href: ROUTES.quote(quote.id),
        displayId: quote.id,
        customerName: customerName !== '—' ? customerName : null,
        meta: formatQuoteTotal(quote),
      }
    })
  }, [quotes, t])

  return (
    <TimelineWidget
      title={t('lastQuotesTimeline.title')}
      loading={loading}
      error={error ? t(error) : null}
      entries={entries}
      emptyMessage={t('lastQuotesTimeline.noResults')}
      loadingMessage={t('lastQuotesTimeline.loading')}
      ariaLabel={t('lastQuotesTimeline.ariaLabel')}
    />
  )
}
