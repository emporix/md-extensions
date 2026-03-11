import type { ReactNode } from 'react'
import styles from './TimelineWidget.module.scss'

export type TimelineEntry = {
  id: string
  dateLabel: string
  href: string
  displayId: string
  customerName: string | null
  meta: string
}

type TimelineWidgetProps = {
  title: string
  loading: boolean
  error: string | null
  entries: TimelineEntry[]
  emptyMessage: string
  loadingMessage: string
  ariaLabel: string
  children?: ReactNode
}

export const TimelineWidget = ({
  title,
  loading,
  error,
  entries,
  emptyMessage,
  loadingMessage,
  ariaLabel,
}: TimelineWidgetProps) => {
  const showTimeline = !loading && !error

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{title}</h3>

      {loading && (
        <div className={styles.placeholder}>
          <span>{loadingMessage}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{error}</span>
        </div>
      )}

      {showTimeline && (
        <div className={styles.timeline} role="list" aria-label={ariaLabel}>
          {entries.length === 0 ? (
            <p className={styles.empty}>{emptyMessage}</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className={styles.entry} role="listitem">
                <span className={styles.date}>{entry.dateLabel}</span>
                <span className={styles.dot} aria-hidden />
                <div className={styles.text}>
                  <p className={styles.textLine}>
                    <strong>
                      <a href={entry.href} className={styles.itemLink}>
                        #{entry.displayId}
                      </a>
                    </strong>
                    {entry.customerName && <> · {entry.customerName}</>}
                  </p>
                  <p className={styles.textMeta}>{entry.meta}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
