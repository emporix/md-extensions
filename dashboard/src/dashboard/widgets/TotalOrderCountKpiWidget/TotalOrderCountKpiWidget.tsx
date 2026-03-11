import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrderStats } from '../../hooks/useOrderStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalOrderCountKpiWidget = () => {
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

  const totals = data?.values?.totals?.[0]
  const value = totals?.totalOrders != null ? String(totals.totalOrders) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-shopping-cart" />}
      title={t('widgets.totalOrderCountKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
