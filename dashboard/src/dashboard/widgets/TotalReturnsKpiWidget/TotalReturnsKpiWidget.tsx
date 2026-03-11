import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useReturns } from '../../hooks/useReturns'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalReturnsKpiWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { total, loading, error } = useReturns(
    appState?.tenant,
    appState?.token
  )

  const value = total != null ? String(total) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-refresh" />}
      title={t('widgets.totalReturnsKpi')}
      loading={loading}
      error={error}
      isAvailable={Boolean(appState?.tenant)}
      unavailableMessage={t('kpi.signInToView')}
      value={value}
    />
  )
}
