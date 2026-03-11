import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'
import { formatCurrency } from '../../helpers/chart.helpers'
import { getAverageQuoteValue } from '../../helpers/quoteStats.helpers'

export const AverageQuoteValueKpiWidget = () => {
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
  const avgValue = getAverageQuoteValue(totals)
  const value = avgValue != null ? formatCurrency(avgValue, currency, 2) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-euro" />}
      title={t('widgets.averageQuoteValueKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
