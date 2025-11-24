import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'
import { ResolutionEfficiencyMetrics } from '../../services/analyticsService'
import { EFFICIENCY_THRESHOLDS } from '../../constants/chartConstants'
import '../../styles/components/MetricsPanel.css'

interface ResolutionEfficiencyKPIProps {
  data: ResolutionEfficiencyMetrics | null
  loading: boolean
}

/**
 * Resolution Efficiency KPI Component
 * Displays requests per session metric with color-coded efficiency levels
 */
const ResolutionEfficiencyKPI: React.FC<ResolutionEfficiencyKPIProps> = ({
  data,
  loading,
}) => {
  const { t } = useTranslation()

  const efficiencyColor = useMemo(() => {
    if (!data || data.requestsPerSession === 0) return 'neutral'
    if (data.requestsPerSession < EFFICIENCY_THRESHOLDS.EXCELLENT)
      return 'success'
    if (data.requestsPerSession < EFFICIENCY_THRESHOLDS.GOOD) return 'good'
    if (data.requestsPerSession < EFFICIENCY_THRESHOLDS.MODERATE)
      return 'warning'
    return 'error'
  }, [data])

  if (loading) {
    return (
      <div className="metrics-card metrics-card-fixed">
        <div className="metrics-loading">
          <ProgressSpinner />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="metrics-card metrics-card-fixed">
      <div className="metrics-header">
        <i className="pi pi-bolt metrics-icon" aria-hidden="true"></i>
        <h3 className="metrics-title">
          {t('resolution_efficiency', 'Resolution Efficiency')}
        </h3>
      </div>
      <div className="metrics-content">
        <div className={`metrics-value metrics-value-${efficiencyColor}`}>
          {data.requestsPerSession.toFixed(2)}
        </div>
        <div className="metrics-details">
          <div className="metrics-detail-item">
            <span className="metrics-label">
              {t('requests_per_session', 'Requests per Session')}:
            </span>
            <span className="metrics-count">
              {data.requestsPerSession.toFixed(2)}
            </span>
          </div>
          <div className="metrics-detail-item">
            <span className="metrics-label">
              {t('total_requests', 'Total Requests')}:
            </span>
            <span className="metrics-count">
              {data.totalRequests.toLocaleString()}
            </span>
          </div>
          <div className="metrics-detail-item">
            <span className="metrics-label">
              {t('total_sessions', 'Total Sessions')}:
            </span>
            <span className="metrics-count">
              {data.totalSessions.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="metrics-efficiency-hint">
          {t(
            'efficiency_hint',
            'Lower is better - fewer requests needed per session to solve a request'
          )}
        </div>
      </div>
    </div>
  )
}

export default ResolutionEfficiencyKPI
