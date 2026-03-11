import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useQuoteStats } from '../../hooks/useQuoteStats'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'
import { getAcceptedQuotesCount } from '../../helpers/quoteStats.helpers'

export const AcceptedQuotesKpiWidget = () => {
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
  const accepted = getAcceptedQuotesCount(totals)
  const value = String(accepted)

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-check-circle" />}
      title={t('widgets.acceptedQuotesKpi')}
      loading={loading}
      error={error}
      isAvailable
      unavailableMessage=""
      value={value}
    />
  )
}
