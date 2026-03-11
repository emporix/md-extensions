import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalQuoteCountKpiWidget = () => {
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
  const value = totals?.totalQuotes != null ? String(totals.totalQuotes) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-file-edit" />}
      title={t('widgets.totalQuoteCountKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
