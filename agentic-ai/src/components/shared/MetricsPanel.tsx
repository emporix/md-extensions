import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router'
import { AppState } from '../../types/common'
import {
  AnalyticsService,
  SessionSeverityDistribution,
  SessionErrorTrendData,
  ResolutionEfficiencyMetrics,
} from '../../services/analyticsService'
import ResolutionEfficiencyKPI from './ResolutionEfficiencyKPI'
import SessionSeverityChart from './SessionSeverityChart'
import SessionErrorTrendChart from './SessionErrorTrendChart'
import '../../styles/components/MetricsPanel.css'

interface MetricsPanelProps {
  appState: AppState
  refreshTrigger?: number
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  appState,
  refreshTrigger,
}) => {
  const location = useLocation()
  const [resolutionEfficiency, setResolutionEfficiency] =
    useState<ResolutionEfficiencyMetrics | null>(null)
  const [sessionSeverity, setSessionSeverity] =
    useState<SessionSeverityDistribution | null>(null)
  const [sessionErrorTrend, setSessionErrorTrend] = useState<
    SessionErrorTrendData[]
  >([])
  const [loading, setLoading] = useState(true)

  const analyticsService = useMemo(
    () => new AnalyticsService(appState),
    [appState]
  )

  const fetchMetrics = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setLoading(true)

        const urlParams = new URLSearchParams(location.search)
        const agentId = urlParams.get('agentId') || undefined

        const snapshot = await analyticsService.getDashboardSnapshot(
          agentId,
          4,
          forceRefresh
        )

        setResolutionEfficiency(snapshot.resolutionEfficiency)
        setSessionSeverity(snapshot.sessionSeverity)
        setSessionErrorTrend(snapshot.sessionErrorTrend)
      } catch (error) {
        console.error('Error fetching session metrics:', error)
      } finally {
        setLoading(false)
      }
    },
    [analyticsService, location.search]
  )

  useEffect(() => {
    fetchMetrics(false)
  }, [fetchMetrics])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchMetrics(true)
    }
  }, [refreshTrigger, fetchMetrics])

  return (
    <div className="metrics-panel">
      <div className="metrics-grid">
        <ResolutionEfficiencyKPI
          data={resolutionEfficiency}
          loading={loading}
        />
        <SessionSeverityChart data={sessionSeverity} loading={loading} />
        <SessionErrorTrendChart data={sessionErrorTrend} loading={loading} />
      </div>
    </div>
  )
}

export default MetricsPanel
