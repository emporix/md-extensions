import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useVendorsCount } from '../../hooks/useVendorsCount'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalVendorsKpiWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { count, loading, error } = useVendorsCount(
    appState?.tenant,
    appState?.token
  )

  const value = count != null ? String(count) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-building" />}
      title={t('widgets.totalVendorsKpi')}
      loading={loading}
      error={error}
      isAvailable={Boolean(appState?.tenant)}
      unavailableMessage={t('kpi.signInToView')}
      value={value}
    />
  )
}
