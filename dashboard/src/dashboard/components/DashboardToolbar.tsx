import { Dropdown } from 'primereact/dropdown'
import type {
  DashboardSite,
  DashboardTimeRange,
} from '../models/DashboardContext.types'
import { useDashboardContext } from '../context/DashboardContext'
import { useTranslation } from '../../shared/i18n'
import { TimeRangePicker } from './TimeRangePicker'
import styles from './DashboardToolbar.module.scss'

type DashboardToolbarProps = {
  sites: DashboardSite[]
  selectedSite: DashboardSite | null
  onSiteChange: (site: DashboardSite | null) => void
  timeRange: DashboardTimeRange
  onTimeRangeChange: (timeRange: DashboardTimeRange) => void
  sitesLoading?: boolean
  sitesError?: string | null
}

export const DashboardToolbar = ({
  sites,
  selectedSite,
  onSiteChange,
  timeRange,
  onTimeRangeChange,
  sitesLoading = false,
  sitesError = null,
}: DashboardToolbarProps) => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')

  const handleSiteChange = (e: { value: string | null }) => {
    const code = e.value as string | null
    const next = code ? (sites.find((s) => s.code === code) ?? null) : null
    onSiteChange(next)
  }

  const siteOptions = sites.map((s) => ({
    label: `${s.name} - ${s.code}`,
    value: s.code,
  }))

  const selectedSiteCode = selectedSite?.code ?? null
  const sitePlaceholder = sitesError
    ? t('toolbar.errorLoadingSites')
    : sitesLoading
      ? t('toolbar.loading')
      : t('toolbar.selectSite')

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="Dashboard filters"
    >
      <div className={styles.group}>
        <Dropdown
          id="dashboard-site"
          value={selectedSiteCode}
          options={siteOptions}
          onChange={handleSiteChange}
          optionLabel="label"
          optionValue="value"
          placeholder={sitePlaceholder}
          showClear
          className={styles.dropdown}
          aria-label={t('aria.selectSite')}
          disabled={sitesLoading}
        />
        {sitesError && (
          <span className={styles.error} role="alert">
            {sitesError}
          </span>
        )}
      </div>
      <div className={styles.group}>
        <TimeRangePicker
          id="dashboard-time-range"
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          aria-label={t('aria.selectTimeRange')}
          className={styles.timeRangePicker}
        />
      </div>
    </div>
  )
}
