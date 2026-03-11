import { useMemo } from 'react'
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy'
import type { Layout } from 'react-grid-layout/legacy'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import type { GridLayoutItem } from '../models/DashboardContext.types'
import type { RegisteredWidget } from '../data/widgetRegistry'
import {
  toRglLayout,
  fromRglLayout,
  isKpiWidget,
  RESIZE_HANDLES,
} from '../helpers/layout.helpers'
import { WidgetCard } from './WidgetCard'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import styles from './DashboardGrid.module.scss'

const COLS = 24
const ROW_HEIGHT = 40
const MARGIN: [number, number] = [16, 16]
const CONTAINER_PADDING: [number, number] = [0, 16]

const GridWithWidth = WidthProvider(ReactGridLayout)

type DashboardGridProps = {
  layout: GridLayoutItem[]
  onLayoutChange: (layout: GridLayoutItem[]) => void
  widgets: Record<string, RegisteredWidget>
  isEditMode: boolean
  onRemoveWidget: (widgetId: string) => void
  t?: (key: string) => string
}

export const DashboardGrid = ({
  layout,
  onLayoutChange,
  widgets,
  isEditMode,
  onRemoveWidget,
  t,
}: DashboardGridProps) => {
  const rglLayout = useMemo(() => toRglLayout(layout), [layout])

  const handleLayoutChange = (newLayout: Layout) => {
    onLayoutChange(fromRglLayout(newLayout))
  }

  const draggableHandle = useMemo(() => `.${styles.dragHandle}`, [])

  const getWidgetLabel = (widgetId: string, fallback: string): string =>
    t ? t(`widgets.${widgetId}`) : fallback

  return (
    <div className={styles.container}>
      <GridWithWidth
        layout={rglLayout}
        onLayoutChange={handleLayoutChange}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={CONTAINER_PADDING}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle={draggableHandle}
        resizeHandles={RESIZE_HANDLES}
        autoSize
        className={styles.grid}
      >
        {layout.map((item) => {
          const def = widgets[item.i]
          if (!def) return null
          const WidgetComponent = def.component
          const widgetLabel = getWidgetLabel(item.i, def.label)
          return (
            <div key={item.i} className={styles.widgetWrapper}>
              <WidgetCard
                layout={{ id: item.i, colSpan: item.w, rowSpan: item.h }}
                editMode={isEditMode}
                isKpi={isKpiWidget(item.i)}
                widgetLabel={widgetLabel}
                onRemove={isEditMode ? () => onRemoveWidget(item.i) : undefined}
                dragHandleClassName={styles.dragHandle}
              >
                <WidgetErrorBoundary widgetId={item.i}>
                  <WidgetComponent />
                </WidgetErrorBoundary>
              </WidgetCard>
            </div>
          )
        })}
      </GridWithWidth>
    </div>
  )
}
