import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { getAverageQuoteValueChartConfig } from '../../helpers/quoteStats.helpers'
import { ChartWidget } from '../../components/ChartWidget'

export const AvgQuoteValueOverTimeWidget = () => {
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
  const currency =
    totals[0]?.groupedBy.currencyISOCode ?? site?.currency ?? 'EUR'

  return (
    <ChartWidget
      title={t('widgets.avgQuoteValueOverTime')}
      loading={loading}
      error={error}
      hasData={totals.length > 0}
      buildConfig={() => getAverageQuoteValueChartConfig(totals, currency)}
      deps={[data, site?.currency]}
      t={t}
    />
  )
}
