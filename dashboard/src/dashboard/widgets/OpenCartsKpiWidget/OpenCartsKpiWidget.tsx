import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useCartsCount } from '../../hooks/useCartsCount'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const OpenCartsKpiWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { count, loading, error } = useCartsCount(
    appState?.tenant,
    appState?.token,
    site?.code,
    'OPEN'
  )

  const value = count != null ? String(count) : '—'
  const isSignedIn = Boolean(appState?.tenant)
  const isNoAccess =
    error === 'Access denied' || (site?.code != null && count === 0 && !error)

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-shopping-cart" />}
      title={t('widgets.openCartsKpi')}
      loading={loading}
      error={isNoAccess ? null : error}
      isAvailable={isSignedIn && !isNoAccess}
      unavailableMessage={
        isNoAccess ? t('kpi.noAccess') : t('kpi.signInToView')
      }
      value={value}
    />
  )
}
