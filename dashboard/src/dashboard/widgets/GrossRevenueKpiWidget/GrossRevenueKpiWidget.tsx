import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrderStats } from '../../hooks/useOrderStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'
import { formatCurrency } from '../../helpers/chart.helpers'

export const GrossRevenueKpiWidget = () => {
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
  const value =
    totals?.gov != null ? formatCurrency(totals.gov, currency, 2) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-wallet" />}
      title={t('widgets.grossRevenueKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
