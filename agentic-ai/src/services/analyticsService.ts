import { AppState } from '../types/common'
import { CACHE_TTL } from '../utils/constants'
import { ApiClient } from './apiClient'

export interface SessionSeverityDistribution {
  success: number
  warning: number
  error: number
}

export interface SessionErrorTrendData {
  date: string
  errorSessions: number
  totalSessions: number
  errorRate: number
}

export interface ResolutionEfficiencyMetrics {
  requestsPerSession: number
  totalRequests: number
  totalSessions: number
}

interface AgentAnalyticsApiResponse {
  requests: {
    total: number
    bySeverity: { info: number; warning: number; error: number }
    errorRate: number
  }
  sessions: {
    total: number
    bySeverity: { success: number; warning: number; error: number }
    errorRate: number
  }
  resolutionEfficiency: ResolutionEfficiencyMetrics
  requestTrend: Array<{
    date: string
    total: number
    errors: number
    errorRate: number
  }>
  sessionTrend: Array<{
    date: string
    totalSessions: number
    errorSessions: number
    errorRate: number
  }>
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class AnalyticsService {
  private api: ApiClient
  private tenant: string
  private static cache: Map<string, CacheEntry<unknown>> = new Map()

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  private getCached<T>(key: string): T | null {
    const entry = AnalyticsService.cache.get(key)
    if (!entry) {
      return null
    }
    const now = Date.now()
    if (now - entry.timestamp > CACHE_TTL) {
      AnalyticsService.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  private setCache<T>(key: string, data: T): void {
    AnalyticsService.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private bundleCacheKey(agentId: string | undefined, trendWeeks: number): string {
    return `bundle_${agentId ?? 'all'}_${trendWeeks}`
  }

  private async fetchAnalyticsBundle(
    agentId: string | undefined,
    trendWeeks: number,
    forceRefresh: boolean
  ): Promise<AgentAnalyticsApiResponse> {
    const cacheKey = this.bundleCacheKey(agentId, trendWeeks)
    if (!forceRefresh) {
      const cached = this.getCached<AgentAnalyticsApiResponse>(cacheKey)
      if (cached) {
        return cached
      }
    }
    const params = new URLSearchParams()
    if (agentId) {
      params.set('agentId', agentId)
    }
    params.set('trendWeeks', String(trendWeeks))
    const url = `/ai-service/${this.tenant}/agentic/analytics?${params.toString()}`
    const data = await this.api.get<AgentAnalyticsApiResponse>(url)
    this.setCache(cacheKey, data)
    return data
  }

  async getDashboardSnapshot(
    agentId?: string,
    trendWeeks: number = 4,
    forceRefresh: boolean = false
  ): Promise<{
    resolutionEfficiency: ResolutionEfficiencyMetrics
    sessionSeverity: SessionSeverityDistribution
    sessionErrorTrend: SessionErrorTrendData[]
  }> {
    const b = await this.fetchAnalyticsBundle(agentId, trendWeeks, forceRefresh)
    return {
      resolutionEfficiency: b.resolutionEfficiency,
      sessionSeverity: {
        success: b.sessions.bySeverity.success,
        warning: b.sessions.bySeverity.warning,
        error: b.sessions.bySeverity.error,
      },
      sessionErrorTrend: b.sessionTrend.map((s) => ({
        date: s.date,
        errorSessions: s.errorSessions,
        totalSessions: s.totalSessions,
        errorRate: s.errorRate,
      })),
    }
  }
}
