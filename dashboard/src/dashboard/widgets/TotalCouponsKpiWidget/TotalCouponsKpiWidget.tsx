import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useCouponsCount } from '../../hooks/useCouponsCount'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalCouponsKpiWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { count, loading, error } = useCouponsCount(
    appState?.tenant,
    appState?.token
  )

  const value = count != null ? String(count) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-tag" />}
      title={t('widgets.totalCouponsKpi')}
      loading={loading}
      error={error}
      isAvailable={Boolean(appState?.tenant)}
      unavailableMessage={t('kpi.signInToView')}
      value={value}
    />
  )
}
