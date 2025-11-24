import { AppState } from '../types/common'
import { RequestLogs, SessionLogs } from '../types/Log'
import { ApiClient } from './apiClient'

export interface ErrorMetrics {
  totalLogs: number
  errorLogs: number
  errorRate: number
}

export interface ErrorTrendData {
  date: string
  errors: number
  total: number
  errorRate: number
}

export interface SessionSeverityDistribution {
  success: number // INFO severity
  warning: number // WARNING severity
  error: number // ERROR severity
}

export interface SessionErrorTrendData {
  date: string
  errorSessions: number
  totalSessions: number
  errorRate: number // Percentage
}

export interface ResolutionEfficiencyMetrics {
  requestsPerSession: number
  totalRequests: number
  totalSessions: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class AnalyticsService {
  private api: ApiClient
  private tenant: string

  // Static cache shared across all instances
  private static cache: Map<string, CacheEntry<unknown>> = new Map()
  private static cacheTTL: number = 5 * 60 * 1000 // 5 minutes in milliseconds

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  /**
   * Get cached data or fetch if expired
   */
  private getCached<T>(key: string): T | null {
    const entry = AnalyticsService.cache.get(key)
    if (!entry) {
      console.log(`[Analytics Cache] MISS: ${key}`)
      return null
    }

    const now = Date.now()
    const age = Math.round((now - entry.timestamp) / 1000) // seconds
    if (now - entry.timestamp > AnalyticsService.cacheTTL) {
      // Cache expired
      console.log(`[Analytics Cache] EXPIRED: ${key} (age: ${age}s)`)
      AnalyticsService.cache.delete(key)
      return null
    }

    console.log(`[Analytics Cache] HIT: ${key} (age: ${age}s)`)
    return entry.data as T
  }

  /**
   * Set cache entry
   */
  private setCache<T>(key: string, data: T): void {
    console.log(
      `[Analytics Cache] SET: ${key} (TTL: ${AnalyticsService.cacheTTL / 1000}s)`
    )
    AnalyticsService.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    AnalyticsService.cache.clear()
  }

  /**
   * Clear cache for specific agent
   */
  public clearAgentCache(agentId?: string): void {
    const prefix = agentId ? `agent_${agentId}_` : 'all_'
    Array.from(AnalyticsService.cache.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => AnalyticsService.cache.delete(key))
  }

  /**
   * Get cache statistics (for debugging)
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: AnalyticsService.cache.size,
      keys: Array.from(AnalyticsService.cache.keys()),
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-Total-Count': 'true',
    }
  }

  /**
   * Get total count from API response headers (logs endpoint)
   */
  private async getTotalCount(queryParams: string): Promise<number> {
    const url = `/ai-service/${this.tenant}/agentic/logs/requests${queryParams}`
    const response = await this.api.getWithHeaders<RequestLogs[]>(url, {
      headers: this.getHeaders(),
    })
    return parseInt(response.headers.get('X-Total-Count') || '0', 10)
  }

  /**
   * Get total count from API response headers (sessions endpoint)
   */
  private async getSessionCount(queryParams: string): Promise<number> {
    const url = `/ai-service/${this.tenant}/agentic/logs/sessions${queryParams}`
    const response = await this.api.getWithHeaders<SessionLogs[]>(url, {
      headers: this.getHeaders(),
    })
    return parseInt(response.headers.get('X-Total-Count') || '0', 10)
  }

  /**
   * Get error rate metrics
   */
  async getErrorRate(
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<ErrorMetrics> {
    const cacheKey = agentId ? `agent_${agentId}_error_rate` : 'all_error_rate'

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<ErrorMetrics>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const agentFilter = agentId ? `triggerAgentId:${agentId}` : ''
      // API uses numeric severity values: INFO=10, WARNING=20, ERROR=30
      const errorFilter = agentFilter
        ? `${agentFilter} severity:30`
        : 'severity:30'

      const totalQuery = agentFilter
        ? `?q=${agentFilter}&pageSize=1`
        : '?pageSize=1'
      const errorQuery = `?q=${errorFilter}&pageSize=1`

      const [totalLogs, errorLogs] = await Promise.all([
        this.getTotalCount(totalQuery),
        this.getTotalCount(errorQuery),
      ])

      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0

      const result: ErrorMetrics = {
        totalLogs,
        errorLogs,
        errorRate: Math.round(errorRate * 100) / 100, // Round to 2 decimals
      }

      // Cache the result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('Error fetching error rate metrics:', error)
      return { totalLogs: 0, errorLogs: 0, errorRate: 0 }
    }
  }

  /**
   * Get error trend data for the last N weeks
   */
  async getErrorTrend(
    weeks: number = 4,
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<ErrorTrendData[]> {
    const cacheKey = agentId
      ? `agent_${agentId}_trend_${weeks}`
      : `all_trend_${weeks}`

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<ErrorTrendData[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const trends: ErrorTrendData[] = []
      const today = new Date()
      const agentFilter = agentId ? `triggerAgentId:${agentId} ` : ''

      // Fetch data for each week
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() - i * 7)
        weekEnd.setHours(23, 59, 59, 999)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        const startISO = weekStart.toISOString()
        const endISO = weekEnd.toISOString()

        const dateFilter = `metadata.createdAt:(>="${startISO}" AND <="${endISO}")`
        const totalQuery = `?q=${agentFilter}${dateFilter}&pageSize=1`
        // API uses numeric severity values: ERROR=30
        const errorQuery = `?q=${agentFilter}severity:30 ${dateFilter}&pageSize=1`

        const [total, errors] = await Promise.all([
          this.getTotalCount(totalQuery),
          this.getTotalCount(errorQuery),
        ])

        const errorRate = total > 0 ? (errors / total) * 100 : 0

        trends.push({
          date: weekStart.toISOString().split('T')[0], // YYYY-MM-DD
          errors,
          total,
          errorRate: Math.round(errorRate * 100) / 100,
        })
      }

      // Cache the result
      this.setCache(cacheKey, trends)

      return trends
    } catch (error) {
      console.error('Error fetching error trend data:', error)
      return []
    }
  }

  /**
   * Get severity distribution
   */
  async getSeverityDistribution(
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<{
    info: number
    warning: number
    error: number
  }> {
    const cacheKey = agentId
      ? `agent_${agentId}_severity_dist`
      : 'all_severity_dist'

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<{
        info: number
        warning: number
        error: number
      }>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const agentFilter = agentId ? `triggerAgentId:${agentId} ` : ''

      // API uses numeric severity values: INFO=10, WARNING=20, ERROR=30
      const [info, warning, error] = await Promise.all([
        this.getTotalCount(`?q=${agentFilter}severity:10&pageSize=1`),
        this.getTotalCount(`?q=${agentFilter}severity:20&pageSize=1`),
        this.getTotalCount(`?q=${agentFilter}severity:30&pageSize=1`),
      ])

      const result = { info, warning, error }

      // Cache the result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('Error fetching severity distribution:', error)
      return { info: 0, warning: 0, error: 0 }
    }
  }

  /**
   * Get session severity distribution (for pie chart)
   */
  async getSessionSeverityDistribution(
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<SessionSeverityDistribution> {
    const cacheKey = agentId
      ? `agent_${agentId}_session_severity`
      : 'all_session_severity'

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<SessionSeverityDistribution>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const agentFilter = agentId ? `triggerAgentId:${agentId} ` : ''

      // API uses numeric severity values: INFO=10, WARNING=20, ERROR=30
      const [success, warning, error] = await Promise.all([
        this.getSessionCount(`?q=${agentFilter}severity:10&pageSize=1`),
        this.getSessionCount(`?q=${agentFilter}severity:20&pageSize=1`),
        this.getSessionCount(`?q=${agentFilter}severity:30&pageSize=1`),
      ])

      const result: SessionSeverityDistribution = { success, warning, error }

      // Cache the result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('Error fetching session severity distribution:', error)
      return { success: 0, warning: 0, error: 0 }
    }
  }

  /**
   * Get session error trend data for the last N weeks
   */
  async getSessionErrorTrend(
    weeks: number = 4,
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<SessionErrorTrendData[]> {
    const cacheKey = agentId
      ? `agent_${agentId}_session_trend_${weeks}`
      : `all_session_trend_${weeks}`

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<SessionErrorTrendData[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const trends: SessionErrorTrendData[] = []
      const today = new Date()
      const agentFilter = agentId ? `triggerAgentId:${agentId} ` : ''

      // Fetch data for each week
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() - i * 7)
        weekEnd.setHours(23, 59, 59, 999)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        const startISO = weekStart.toISOString()
        const endISO = weekEnd.toISOString()

        const dateFilter = `metadata.createdAt:(>="${startISO}" AND <="${endISO}")`
        const totalQuery = `?q=${agentFilter}${dateFilter}&pageSize=1`
        // API uses numeric severity values: ERROR=30
        const errorQuery = `?q=${agentFilter}severity:30 ${dateFilter}&pageSize=1`

        const [totalSessions, errorSessions] = await Promise.all([
          this.getSessionCount(totalQuery),
          this.getSessionCount(errorQuery),
        ])

        const errorRate =
          totalSessions > 0 ? (errorSessions / totalSessions) * 100 : 0

        trends.push({
          date: weekStart.toISOString().split('T')[0], // YYYY-MM-DD
          errorSessions,
          totalSessions,
          errorRate: Math.round(errorRate * 100) / 100, // Round to 2 decimals
        })
      }

      // Cache the result
      this.setCache(cacheKey, trends)

      return trends
    } catch (error) {
      console.error('Error fetching session error trend data:', error)
      return []
    }
  }

  /**
   * Get resolution efficiency metrics (requests per session)
   */
  async getResolutionEfficiency(
    agentId?: string,
    forceRefresh: boolean = false
  ): Promise<ResolutionEfficiencyMetrics> {
    const cacheKey = agentId
      ? `agent_${agentId}_resolution_efficiency`
      : 'all_resolution_efficiency'

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<ResolutionEfficiencyMetrics>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const agentFilter = agentId ? `triggerAgentId:${agentId}` : ''

      const totalRequestsQuery = agentFilter
        ? `?q=${agentFilter}&pageSize=1`
        : '?pageSize=1'
      const totalSessionsQuery = agentFilter
        ? `?q=${agentFilter}&pageSize=1`
        : '?pageSize=1'

      const [totalRequests, totalSessions] = await Promise.all([
        this.getTotalCount(totalRequestsQuery),
        this.getSessionCount(totalSessionsQuery),
      ])

      const requestsPerSession =
        totalSessions > 0
          ? Math.round((totalRequests / totalSessions) * 100) / 100 // Round to 2 decimals
          : 0

      const result: ResolutionEfficiencyMetrics = {
        requestsPerSession,
        totalRequests,
        totalSessions,
      }

      // Cache the result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('Error fetching resolution efficiency metrics:', error)
      return { requestsPerSession: 0, totalRequests: 0, totalSessions: 0 }
    }
  }
}
