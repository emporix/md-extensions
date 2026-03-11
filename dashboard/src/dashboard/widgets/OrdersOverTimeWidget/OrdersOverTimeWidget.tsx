import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrderStats } from '../../hooks/useOrderStats'
import { getOrdersChartConfig } from '../../helpers/orderStats.helpers'
import { ChartWidget } from '../../components/ChartWidget'

export const OrdersOverTimeWidget = () => {
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

  return (
    <ChartWidget
      title={t('widgets.ordersOverTime')}
      loading={loading}
      error={error}
      hasData={totals.length > 0}
      buildConfig={() => getOrdersChartConfig(totals)}
      deps={[data]}
      t={t}
    />
  )
}
