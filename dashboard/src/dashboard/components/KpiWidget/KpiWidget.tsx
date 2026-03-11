import type { ReactNode } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { formatGrowthPercent } from '../../helpers/chart.helpers'
import styles from './KpiWidget.module.scss'

type KpiWidgetProps = {
  icon: ReactNode
  title: string
  value: string
  comparison?: {
    percent: number
    /** Translation key for the period label (e.g. kpi.vsLastWeek). Defaults to kpi.vsLastMonth */
    periodKey?: string
  }
}

export const KpiWidget = ({
  icon,
  title,
  value,
  comparison,
}: KpiWidgetProps) => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const hasGrowth = comparison !== undefined && comparison !== null
  const isPositive = hasGrowth && comparison.percent >= 0
  const percentStr = hasGrowth ? formatGrowthPercent(comparison.percent) : null
  const trendIconClass = isPositive
    ? 'pi pi-arrow-up-right'
    : 'pi pi-arrow-down-right'
  const rootClassName = hasGrowth
    ? `${styles.root} ${styles.rootWithComparison}`
    : `${styles.root} ${styles.rootWithoutComparison}`
  const bodyClassName = hasGrowth
    ? `${styles.body} ${styles.bodyWithComparison}`
    : `${styles.body} ${styles.bodyWithoutComparison}`

  return (
    <div className={rootClassName}>
      <div className={styles.header}>
        <span className={styles.iconWrap} aria-hidden>
          {icon}
        </span>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={bodyClassName}>
        <span className={styles.value}>{value}</span>
        {percentStr !== null && (
          <div className={styles.comparisonRow}>
            <span
              className={styles.pill}
              data-positive={isPositive}
              aria-label={`${isPositive ? 'Growth' : 'Decline'}: ${percentStr}`}
            >
              <i className={trendIconClass} aria-hidden />
              {percentStr}
            </span>
            <span className={styles.comparisonLabel}>
              {t(comparison?.periodKey ?? 'kpi.vsLastMonth')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
