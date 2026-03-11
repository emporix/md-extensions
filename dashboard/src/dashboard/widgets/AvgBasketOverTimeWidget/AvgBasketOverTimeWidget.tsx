import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrderStats } from '../../hooks/useOrderStats'
import { getAverageBasketChartConfig } from '../../helpers/orderStats.helpers'
import { ChartWidget } from '../../components/ChartWidget'

export const AvgBasketOverTimeWidget = () => {
  const { appState, site, timeRange } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { data, loading, error } = useOrderStats(
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
      title={t('widgets.avgBasketOverTime')}
      loading={loading}
      error={error}
      hasData={totals.length > 0}
      buildConfig={() => getAverageBasketChartConfig(totals, currency)}
      deps={[data, site?.currency]}
      t={t}
    />
  )
}
