import type { ReactNode } from 'react'
import { useDashboardContext } from '../context/DashboardContext'
import { useTranslation } from '../../shared/i18n'
import { KpiWidget } from './KpiWidget/KpiWidget'

type KpiMetricWidgetProps = {
  icon: ReactNode
  title: string
  loading: boolean
  error: string | null
  isAvailable: boolean
  unavailableMessage: string
  value: string
  comparison?: {
    percent: number
    periodKey?: string
  }
}

export const KpiMetricWidget = ({
  icon,
  title,
  loading,
  error,
  isAvailable,
  unavailableMessage,
  value,
  comparison,
}: KpiMetricWidgetProps) => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')

  if (loading) {
    return <KpiWidget icon={icon} title={title} value={t('kpi.loading')} />
  }

  if (error) {
    return <KpiWidget icon={icon} title={title} value={t(error)} />
  }

  if (!isAvailable) {
    return <KpiWidget icon={icon} title={title} value={unavailableMessage} />
  }

  return (
    <KpiWidget
      icon={icon}
      title={title}
      value={value}
      comparison={comparison}
    />
  )
}
