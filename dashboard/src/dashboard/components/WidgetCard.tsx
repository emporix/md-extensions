import type { ReactNode } from 'react'
import { Card } from 'primereact/card'
import type { WidgetLayout } from '../models/DashboardContext.types'
import styles from './WidgetCard.module.scss'

type WidgetCardProps = {
  layout: WidgetLayout
  children: ReactNode
  editMode?: boolean
  isKpi?: boolean
  widgetLabel?: string
  onRemove?: () => void
  /** Class name for the drag handle (used by react-grid-layout). Only drag from this element when provided. */
  dragHandleClassName?: string
}

export const WidgetCard = ({
  layout,
  children,
  editMode = false,
  isKpi = false,
  widgetLabel,
  onRemove,
  dragHandleClassName,
}: WidgetCardProps) => {
  const { id } = layout
  const className = [
    styles.card,
    editMode ? styles.cardEdit : '',
    isKpi ? styles.kpiCard : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Card className={className}>
      {editMode && (
        <div
          className={styles.toolbar}
          role="toolbar"
          aria-label={`Widget ${widgetLabel ?? id} actions`}
        >
          {dragHandleClassName && (
            <div className={dragHandleClassName} aria-hidden>
              <i className="pi pi-bars" />
            </div>
          )}
          {onRemove && (
            <button
              type="button"
              aria-label={`Remove ${widgetLabel ?? id} widget`}
              onClick={onRemove}
              className={styles.removeBtn}
            >
              <i className="pi pi-times" aria-hidden />
            </button>
          )}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </Card>
  )
}
