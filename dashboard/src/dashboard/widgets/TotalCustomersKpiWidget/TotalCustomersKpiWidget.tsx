import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useCustomers } from '../../hooks/useCustomers'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const TotalCustomersKpiWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { total, loading, error } = useCustomers(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const value = total != null ? String(total) : '—'
  const isSignedIn = Boolean(appState?.tenant)
  const isNoAccess =
    error === 'Access denied' || (site?.code != null && total === 0 && !error)

  return (
    <KpiMetricWidget
      icon={<i className="pi pi-users" />}
      title={t('widgets.totalCustomersKpi')}
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
