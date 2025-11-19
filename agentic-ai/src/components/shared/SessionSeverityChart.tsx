import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { SessionSeverityDistribution } from '../../services/analyticsService'
import { CHART_COLORS, CHART_CONFIG } from '../../constants/chartConstants'
import '../../styles/components/MetricsPanel.css'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface SessionSeverityChartProps {
  data: SessionSeverityDistribution | null
  loading: boolean
}

const SessionSeverityChart: React.FC<SessionSeverityChartProps> = ({ data, loading }) => {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    if (!data) return null

    const total = data.success + data.warning + data.error

    if (total === 0) return null

    return {
      labels: [
        t('success', 'Success'),
        t('warning', 'Warning'),
        t('error', 'Error'),
      ],
      datasets: [
        {
          data: [data.success, data.warning, data.error],
          backgroundColor: [
            CHART_COLORS.success.background,
            CHART_COLORS.warning.background,
            CHART_COLORS.error.background,
          ],
          borderColor: [
            CHART_COLORS.success.border,
            CHART_COLORS.warning.border,
            CHART_COLORS.error.border,
          ],
          borderWidth: CHART_CONFIG.borderWidth,
        },
      ],
    }
  }, [data, t])

  const chartOptions = useMemo<ChartOptions<'pie'>>(() => {
    return {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: CHART_CONFIG.legendPadding,
            font: {
              size: CHART_CONFIG.legendFontSize,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || ''
              const value = context.parsed || 0
              const total =
                context.dataset.data.reduce((acc: number, curr) => acc + (curr as number), 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
    }
  }, [])

  if (loading) {
    return (
      <div className="metrics-card metrics-card-fixed">
        <div className="metrics-loading">
          <ProgressSpinner />
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="metrics-card metrics-card-fixed">
      <div className="metrics-header">
        <i className="pi pi-chart-pie metrics-icon" aria-hidden="true"></i>
        <h3 className="metrics-title">
          {t('session_severity_distribution', 'Session Severity Distribution')}
        </h3>
      </div>
        <div className="metrics-empty">
          <p>{t('no_session_data', 'No session data available')}</p>
        </div>
      </div>
    )
  }

  const total = data ? data.success + data.warning + data.error : 0

  return (
    <div className="metrics-card metrics-card-chart metrics-card-fixed">
      <div className="metrics-header">
        <i className="pi pi-chart-pie metrics-icon" aria-hidden="true"></i>
        <h3 className="metrics-title">
          {t('session_severity_distribution', 'Session Severity Distribution')}
        </h3>
      </div>
      <div className="metrics-content">
        <div className="metrics-detail-item metrics-detail-item-spaced">
          <span className="metrics-label">{t('total_sessions', 'Total Sessions')}:</span>
          <span className="metrics-count">{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="metrics-chart-container">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default SessionSeverityChart

