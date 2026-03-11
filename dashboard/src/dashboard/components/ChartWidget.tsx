import { useRef, useEffect, useMemo } from 'react'
import { Chart, type ChartConfiguration } from 'chart.js/auto'
import styles from '../widgets/ChartWidget.module.scss'

type ChartWidgetProps = {
  title: string
  loading: boolean
  error: string | null
  hasData: boolean
  buildConfig: () => ChartConfiguration
  deps: ReadonlyArray<unknown>
  t: (key: string) => string
}

export const ChartWidget = ({
  title,
  loading,
  error,
  hasData,
  buildConfig,
  deps,
  t,
}: ChartWidgetProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const buildConfigRef = useRef(buildConfig)
  buildConfigRef.current = buildConfig

  const depsKey = useMemo(() => JSON.stringify(deps), [deps])

  useEffect(() => {
    if (!canvasRef.current || !hasData) {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
      return
    }

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    chartRef.current = new Chart(canvasRef.current, buildConfigRef.current())

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [depsKey, hasData])

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{title}</h3>
      {loading && (
        <div className={styles.placeholder}>
          <span>{t('charts.loading')}</span>
        </div>
      )}
      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{t(error)}</span>
        </div>
      )}
      {!loading && !error && (
        <div className={styles.chartContainer}>
          {hasData ? (
            <canvas ref={canvasRef} />
          ) : (
            <div className={styles.placeholder}>
              <span>{t('charts.noDataForSelectedPeriod')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
