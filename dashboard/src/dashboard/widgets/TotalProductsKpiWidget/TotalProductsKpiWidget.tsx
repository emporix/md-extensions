import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useProductsCount } from '../../hooks/useProductsCount'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalProductsKpiWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { count, loading, error } = useProductsCount(
    appState?.tenant,
    appState?.token
  )

  const value = count != null ? String(count) : '—'

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-box" />}
      title={t('widgets.totalProductsKpi')}
      loading={loading}
      error={error}
      isAvailable={Boolean(appState?.tenant)}
      unavailableMessage={t('kpi.signInToView')}
      value={value}
    />
  )
}
