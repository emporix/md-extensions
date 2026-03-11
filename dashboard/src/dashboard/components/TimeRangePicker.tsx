import { useMemo } from 'react'
import { Calendar } from 'primereact/calendar'
import type {
  DashboardTimeRange,
  TimeRangePreset,
} from '../models/DashboardContext.types'
import { useDashboardContext } from '../context/DashboardContext'
import { useTranslation } from '../../shared/i18n'
import {
  getRangeForPreset,
  normalizeCalendarRange,
  toISODateString,
  parseISODateString,
} from '../helpers/timeRange.helpers'
import styles from './TimeRangePicker.module.scss'

type TimeRangePickerProps = {
  timeRange: DashboardTimeRange
  onTimeRangeChange: (timeRange: DashboardTimeRange) => void
  id?: string
  'aria-label'?: string
  className?: string
}

const PRESETS: TimeRangePreset[] = ['last7', 'last30', 'mtd', 'ytd']

export const TimeRangePicker = ({
  timeRange,
  onTimeRangeChange,
  id = 'dashboard-time-range',
  'aria-label': ariaLabel,
  className,
}: TimeRangePickerProps) => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const resolvedAriaLabel = ariaLabel ?? t('timeRange.selectTimeRange')
  const value = useMemo((): Date[] | undefined => {
    const fromDate = parseISODateString(timeRange.from)
    const toDate = parseISODateString(timeRange.to)
    const fromTime = fromDate.getTime()
    const toTime = toDate.getTime()
    if (fromTime === toTime) {
      return [fromDate, null] as Date[]
    }
    return [fromDate, toDate]
  }, [timeRange.from, timeRange.to])

  const handleCalendarChange = (e: { value: Date | Date[] | undefined }) => {
    const range = normalizeCalendarRange(e.value)
    if (!range) return
    onTimeRangeChange({
      preset: 'custom',
      from: toISODateString(range.from),
      to: toISODateString(range.to),
    })
  }

  const handlePresetClick = (preset: TimeRangePreset) => {
    const { from, to } = getRangeForPreset(preset)
    onTimeRangeChange({
      preset,
      from: toISODateString(from),
      to: toISODateString(to),
    })
  }

  const footer = () => (
    <div className={styles.presets}>
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={styles.presetBtn}
          aria-label={t(`timeRange.${preset}`)}
          onClick={() => handlePresetClick(preset)}
        >
          {t(`timeRange.${preset}`).toUpperCase()}
        </button>
      ))}
    </div>
  )

  return (
    <Calendar
      id={id}
      value={value}
      onChange={handleCalendarChange}
      selectionMode="range"
      readOnlyInput
      dateFormat="mm/dd/yy"
      placeholder={t('timeRange.selectDateRange')}
      className={`${styles.calendar} ${className ?? ''}`}
      panelClassName="dashboard-datepicker-panel"
      aria-label={resolvedAriaLabel}
      showIcon
      footerTemplate={footer}
    />
  )
}
