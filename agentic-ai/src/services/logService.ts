import { RequestLogs, LogSummary, SessionLogs } from '../types/Log'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import { formatDateObject } from '../utils/formatHelpers'

export class LogService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  private getHeaders(
    includeTotalCount: boolean = false
  ): Record<string, string> {
    const headers: Record<string, string> = {}

    if (includeTotalCount) {
      headers['X-Total-Count'] = 'true'
    }

    return headers
  }

  private buildQueryParams(params: {
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
    pageSize?: number
    pageNumber?: number
    agentId?: string
    filters?: Record<string, string>
  }): string {
    const queryParams = new URLSearchParams()

    if (params.sortBy && params.sortOrder) {
      queryParams.append('sort', `${params.sortBy}:${params.sortOrder}`)
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }
    if (params.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    // Build q parameter with filters
    const qParts: string[] = []

    // Add agentId filter if provided (for backward compatibility)
    if (params.agentId) {
      qParts.push(`triggerAgentId:${params.agentId}`)
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([field, value]) => {
        if (value && value.trim()) {
          const trimmedValue = value.trim()
          const isDateRange =
            trimmedValue.startsWith('(>=') || trimmedValue.startsWith('(>')

          if (field === 'severity' || isDateRange) {
            qParts.push(`${field}:${trimmedValue}`)
          } else {
            qParts.push(`${field}:~(${trimmedValue})`)
          }
        }
      })
    }

    if (qParts.length > 0) {
      queryParams.append('q', qParts.join(' '))
    }

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Transform full log to summary format
   */
  private transformToSummary(log: RequestLogs): LogSummary {
    return {
      id: log.id,
      agentId: log.triggerAgentId,
      requestId: log.requestId,
      sessionId: log.sessionId,
      messageCount: log.messages.length,
      errorCount: log.messages.filter((msg) => msg.severity === 'ERROR').length,
      lastActivity: formatDateObject(log.metadata.modifiedAt),
      duration: log.duration,
      severity: log.severity,
    }
  }

  async getAgentLogs(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    pageSize?: number,
    pageNumber?: number,
    agentId?: string,
    filters?: Record<string, string>
  ): Promise<{ data: LogSummary[]; totalCount: number }> {
    const queryString = this.buildQueryParams({
      sortBy,
      sortOrder,
      pageSize,
      pageNumber,
      agentId,
      filters,
    })
    const url = `/ai-service/${this.tenant}/agentic/logs/requests${queryString}`
    const headers = this.getHeaders(true)

    const response = await this.api.getWithHeaders<RequestLogs[]>(url, {
      headers,
    })
    const logs = response.data
    const totalCount = parseInt(
      response.headers.get('X-Total-Count') || '0',
      10
    )

    const data = logs.map((log) => this.transformToSummary(log))

    return { data, totalCount }
  }

  async getAgentLogDetails(logId: string): Promise<RequestLogs> {
    const headers = this.getHeaders()
    const response = await this.api.getWithHeaders<RequestLogs>(
      `/ai-service/${this.tenant}/agentic/logs/requests/${logId}`,
      { headers }
    )
    return response.data
  }

  async getRequestLogs(requestId: string): Promise<RequestLogs | null> {
    const headers = this.getHeaders()
    const response = await this.api.getWithHeaders<RequestLogs[]>(
      `/ai-service/${this.tenant}/agentic/logs/requests?q=requestId:${requestId}`,
      { headers }
    )
    return response.data.length > 0 ? response.data[0] : null
  }

  async getAgentLogsByAgentId(
    agentId: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<{ data: LogSummary[]; totalCount: number }> {
    const queryString = this.buildQueryParams({ agentId, pageSize, pageNumber })
    const headers = this.getHeaders(true)
    const response = await this.api.getWithHeaders<RequestLogs[]>(
      `/ai-service/${this.tenant}/agentic/logs/requests${queryString}`,
      { headers }
    )

    const logs = response.data
    const totalCount = parseInt(
      response.headers.get('X-Total-Count') || '0',
      10
    )
    const data = logs?.map((log) => this.transformToSummary(log))

    return { data, totalCount }
  }

  async getAgentLogsByRequestId(
    requestId: string
  ): Promise<RequestLogs | null> {
    const headers = this.getHeaders()
    const result = await this.api.getWithHeaders<RequestLogs>(
      `/ai-service/${this.tenant}/agentic/logs/requests?q=requestId:${requestId}`,
      { headers }
    )

    // Handle case where API returns an array - take the first log
    if (Array.isArray(result.data)) {
      return result.data.length > 0 ? result.data[0] : null
    }

    return result.data
  }

  async getSessions(
    agentId?: string,
    pageSize?: number,
    pageNumber?: number,
    filters?: Record<string, string>,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC'
  ): Promise<{ data: SessionLogs[]; totalCount: number }> {
    const queryString = this.buildQueryParams({
      sortBy: sortBy || 'metadata.modifiedAt',
      sortOrder: sortOrder || 'DESC',
      pageSize,
      pageNumber,
      agentId,
      filters,
    })

    const url = `/ai-service/${this.tenant}/agentic/logs/sessions${queryString}`
    const headers = this.getHeaders(true)
    const response = await this.api.getWithHeaders<SessionLogs[]>(url, {
      headers,
    })

    const totalCount = parseInt(
      response.headers.get('x-total-count') ||
        response.headers.get('X-Total-Count') ||
        '0',
      10
    )

    return { data: response.data, totalCount }
  }

  async getSessionById(sessionId: string): Promise<SessionLogs> {
    const headers = this.getHeaders()
    const url = `/ai-service/${this.tenant}/agentic/logs/sessions/${sessionId}`
    const response = await this.api.getWithHeaders<SessionLogs>(url, {
      headers,
    })
    return response.data
  }
}
