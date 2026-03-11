import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'
import { formatCurrency } from '../../helpers/chart.helpers'

export const GrossQuoteVolumeKpiWidget = () => {
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

  const totals = data?.values?.totals?.[0]
  const currency = totals?.currencyISOCode ?? site?.currency ?? 'EUR'
  const value =
    totals?.gov != null ? formatCurrency(totals.gov, currency, 2) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-chart-line" />}
      title={t('widgets.grossQuoteVolumeKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
