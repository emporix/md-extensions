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
import { ErrorTrendData } from '../../services/analyticsService'

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

interface ErrorTrendChartProps {
  data: ErrorTrendData[]
  loading: boolean
}

const ErrorTrendChart: React.FC<ErrorTrendChartProps> = ({ data, loading }) => {
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
          label: t('error_rate', 'Error Rate') + ' (%)',
          data: data.map((item) => item.errorRate),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y-rate',
        },
        {
          label: t('total_requests', 'Total Requests'),
          data: data.map((item) => item.total),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y-count',
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
            padding: 15,
            font: {
              size: 12,
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
              if (context.parsed.y !== null) {
                if (context.datasetIndex === 0) {
                  label += context.parsed.y.toFixed(2) + '%'
                } else {
                  label += context.parsed.y.toLocaleString()
                }
              }
              return label
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        'y-rate': {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: t('error_rate_percent', 'Error Rate (%)'),
            font: {
              size: 11,
            },
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: function (value) {
              return (value as number).toFixed(1) + '%'
            },
            font: {
              size: 11,
            },
          },
        },
        'y-count': {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: t('total_requests', 'Total Requests'),
            font: {
              size: 11,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function (value) {
              return (value as number).toLocaleString()
            },
            font: {
              size: 11,
            },
          },
        },
      },
    }
  }, [t])

  if (loading) {
    return (
      <div className="metrics-card">
        <div className="metrics-loading">
          <ProgressSpinner style={{ width: '30px', height: '30px' }} />
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="metrics-card">
        <div className="metrics-header">
          <i className="pi pi-chart-line metrics-icon"></i>
          <h3 className="metrics-title">
            {t('error_trend_4_weeks', 'Error Trend (Last 4 Weeks)')}
          </h3>
        </div>
        <div className="metrics-empty">
          <p>{t('no_trend_data', 'No trend data available')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="metrics-card metrics-card-chart">
      <div className="metrics-header">
        <i className="pi pi-chart-line metrics-icon"></i>
        <h3 className="metrics-title">
          {t('error_trend_4_weeks', 'Error Trend (Last 4 Weeks)')}
        </h3>
      </div>
      <div className="metrics-chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default ErrorTrendChart
