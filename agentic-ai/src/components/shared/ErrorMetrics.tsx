import React from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'
import { ErrorMetrics as ErrorMetricsType } from '../../services/analyticsService'

interface ErrorMetricsProps {
  data: ErrorMetricsType | null
  loading: boolean
}

const ErrorMetrics: React.FC<ErrorMetricsProps> = ({ data, loading }) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="metrics-card">
        <div className="metrics-loading">
          <ProgressSpinner style={{ width: '30px', height: '30px' }} />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getErrorRateColor = (rate: number) => {
    if (rate < 5) return 'success'
    if (rate < 15) return 'warning'
    return 'error'
  }

  const errorRateColor = getErrorRateColor(data.errorRate)

  return (
    <div className="metrics-card">
      <div className="metrics-header">
        <i className="pi pi-exclamation-triangle metrics-icon"></i>
        <h3 className="metrics-title">{t('error_rate', 'Error Rate')}</h3>
      </div>
      <div className="metrics-content">
        <div className={`metrics-value metrics-value-${errorRateColor}`}>
          {data.errorRate.toFixed(2)}%
        </div>
        <div className="metrics-details">
          <div className="metrics-detail-item">
            <span className="metrics-label">
              {t('total_logs', 'Total Logs')}:
            </span>
            <span className="metrics-count">
              {data.totalLogs.toLocaleString()}
            </span>
          </div>
          <div className="metrics-detail-item">
            <span className="metrics-label">
              {t('error_logs', 'Error Logs')}:
            </span>
            <span className="metrics-count metrics-count-error">
              {data.errorLogs.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMetrics
