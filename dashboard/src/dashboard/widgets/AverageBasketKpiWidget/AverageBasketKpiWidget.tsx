import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrderStats } from '../../hooks/useOrderStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'
import { formatCurrency } from '../../helpers/chart.helpers'
import { getAverageBasket } from '../../helpers/orderStats.helpers'

export const AverageBasketKpiWidget = () => {
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
  const currency = totals?.currencyISOCode ?? site?.currency ?? 'EUR'
  const avgBasket = getAverageBasket(totals)
  const value = avgBasket != null ? formatCurrency(avgBasket, currency, 2) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-shopping-bag" />}
      title={t('widgets.averageBasketKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
