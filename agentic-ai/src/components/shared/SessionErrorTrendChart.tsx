import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { SessionErrorTrendData } from '../../services/analyticsService'
import { CHART_COLORS, CHART_CONFIG } from '../../constants/chartConstants'
import '../../styles/components/MetricsPanel.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SessionErrorTrendChartProps {
  data: SessionErrorTrendData[]
  loading: boolean
}

const SessionErrorTrendChart: React.FC<SessionErrorTrendChartProps> = ({
  data,
  loading,
}) => {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const labels = data.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    })

    return {
      labels,
      datasets: [
        {
          label: t('error_rate_percent', 'Error Rate (%)'),
          data: data.map((item) => item.errorRate),
          borderColor: CHART_COLORS.errorRate.border,
          backgroundColor: CHART_COLORS.errorRate.background,
          fill: true,
          tension: CHART_CONFIG.tension,
          pointRadius: CHART_CONFIG.pointRadius,
          pointHoverRadius: CHART_CONFIG.pointHoverRadius,
        },
      ],
    }
  }, [data, t])

  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    return {
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: CHART_CONFIG.legendPadding,
            font: {
              size: CHART_CONFIG.legendFontSize,
            },
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              const value = context.parsed.y
              label += value !== null ? value.toFixed(2) + '%' : '0%'
              return label
            },
            afterLabel: function (context) {
              const dataIndex = context.dataIndex
              const item = data[dataIndex]
              if (item) {
                return [
                  `Error Sessions: ${item.errorSessions}`,
                  `Total Sessions: ${item.totalSessions}`,
                ]
              }
              return []
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: t('week', 'Week'),
            font: {
              size: CHART_CONFIG.axisTitleFontSize,
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: CHART_CONFIG.axisFontSize,
            },
          },
        },
        y: {
          display: true,
          position: 'left',
          title: {
            display: true,
            text: t('error_rate_percent', 'Error Rate (%)'),
            font: {
              size: CHART_CONFIG.axisTitleFontSize,
            },
            color: CHART_COLORS.errorRate.border,
          },
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: function (value) {
              return value + '%'
            },
            font: {
              size: CHART_CONFIG.axisFontSize,
            },
          },
        },
      },
    }
  }, [t, data])

  if (loading) {
    return (
      <div className="metrics-card metrics-card-chart metrics-card-error-trend">
        <div className="metrics-loading">
          <ProgressSpinner />
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="metrics-card metrics-card-chart metrics-card-error-trend">
        <div className="metrics-header">
          <i className="pi pi-chart-line metrics-icon" aria-hidden="true"></i>
          <h3 className="metrics-title">
            {t(
              'session_error_trend_4_weeks',
              'Session Error Trend (Last 4 Weeks)'
            )}
          </h3>
        </div>
        <div className="metrics-empty">
          <p>{t('no_trend_data', 'No trend data available')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="metrics-card metrics-card-chart metrics-card-error-trend">
      <div className="metrics-header">
        <i className="pi pi-chart-line metrics-icon" aria-hidden="true"></i>
        <h3 className="metrics-title">
          {t(
            'session_error_trend_4_weeks',
            'Session Error Trend (Last 4 Weeks)'
          )}
        </h3>
      </div>
      <div className="metrics-chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default SessionErrorTrendChart
