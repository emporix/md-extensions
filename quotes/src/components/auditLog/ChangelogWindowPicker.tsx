import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, type CalendarChangeEvent } from '@emporix/component-library'
import {
  limitChangelogWindow,
  type ChangelogWindow,
} from '../../helpers/auditLog/changelogWindow.helpers'
import styles from './ChangelogWindowPicker.module.scss'

type ChangelogWindowPickerProps = {
  readonly value: ChangelogWindow
  readonly onChange: (window: ChangelogWindow) => void
}

type DraftSelection = readonly [] | readonly [Date]

const startOfLocalDay = (date: Date): Date => {
  const start = new Date(date.getTime())
  start.setHours(0, 0, 0, 0)
  return start
}

const endOfLocalDay = (date: Date): Date => {
  const end = new Date(date.getTime())
  end.setHours(23, 59, 59, 999)
  return end
}

const isSameLocalDay = (first: Date, second: Date): boolean =>
  first.toDateString() === second.toDateString()

/**
 * Picks the audit-log window as a local date-time range. A selection with one
 * end is a draft; with both ends it is limited to 7 days and passed on.
 * The calendar gives a clicked day the time of the range's current end, so a
 * clicked start begins its day and a clicked end ends its day; a time the
 * user sets is kept.
 */
const ChangelogWindowPicker = ({
  value,
  onChange,
}: ChangelogWindowPickerProps): JSX.Element => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<DraftSelection | null>(null)
  const [limited, setLimited] = useState(false)

  const handleChange = (event: CalendarChangeEvent) => {
    const [start, end] = Array.isArray(event.value) ? event.value : []
    if (start && end) {
      const next = limitChangelogWindow(start, draft ? endOfLocalDay(end) : end)
      setDraft(null)
      setLimited(next.limited)
      onChange(next.window)
    } else if (start) {
      const draftStart = draft?.[0]
      const isNewStart = !draftStart || !isSameLocalDay(draftStart, start)
      setDraft([isNewStart ? startOfLocalDay(start) : start])
    } else {
      setDraft([])
    }
  }

  return (
    <div className={styles.picker}>
      <Calendar
        value={draft ? [...draft] : [value.from, value.to]}
        onChange={handleChange}
        selectionMode="range"
        showTime
        hourFormat="24"
        dateFormat={t('global.dateFormat')}
        readOnly
        label={t('auditLog.window.label')}
        data-testid="changelog-window-picker"
      />
      {limited && (
        <small className={styles.hint}>{t('auditLog.window.limitHint')}</small>
      )}
    </div>
  )
}

export default ChangelogWindowPicker
