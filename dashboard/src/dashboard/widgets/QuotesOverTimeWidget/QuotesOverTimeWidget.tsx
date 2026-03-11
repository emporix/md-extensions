import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { getQuotesChartConfig } from '../../helpers/quoteStats.helpers'
import { ChartWidget } from '../../components/ChartWidget'

export const QuotesOverTimeWidget = () => {
  const { appState, site, timeRange } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { data, loading, error } = useQuoteStats(
    appState?.tenant,
    appState?.token,
    timeRange.from,
    timeRange.to,
    appState?.currency ?? site?.currency,
    site?.code
  )

  const totals = data?.values?.groupedTotals ?? []

  return (
    <ChartWidget
      title={t('widgets.quotesOverTime')}
      loading={loading}
      error={error}
      hasData={totals.length > 0}
      buildConfig={() => getQuotesChartConfig(totals)}
      deps={[data]}
      t={t}
    />
  )
}
