import { RequestLogs, LogSummary, SessionLogs } from '../types/Log'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import { formatDateObject } from '../utils/formatHelpers'
import {
  getApiHeaders,
  buildQueryParams,
  parseTotalCount,
} from '../utils/apiHelpers'

export class LogService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
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
    const queryString = buildQueryParams(
      {
        sortBy,
        sortOrder,
        pageSize,
        pageNumber,
        agentId,
        filters,
      },
      {
        agentIdField: 'triggerAgentId',
        exactMatchFields: ['severity'],
      }
    )
    const url = `/ai-service/${this.tenant}/agentic/logs/requests${queryString}`
    const headers = getApiHeaders(true)

    const response = await this.api.getWithHeaders<RequestLogs[]>(url, {
      headers,
    })
    const logs = response.data
    const totalCount = parseTotalCount(response.headers)

    const data = logs.map((log) => this.transformToSummary(log))

    return { data, totalCount }
  }

  async getAgentLogDetails(logId: string): Promise<RequestLogs> {
    const headers = getApiHeaders()
    const response = await this.api.getWithHeaders<RequestLogs>(
      `/ai-service/${this.tenant}/agentic/logs/requests/${logId}`,
      { headers }
    )
    return response.data
  }

  async getRequestLogs(requestId: string): Promise<RequestLogs | null> {
    const headers = getApiHeaders()
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
    const queryString = buildQueryParams(
      { agentId, pageSize, pageNumber },
      {
        agentIdField: 'triggerAgentId',
        exactMatchFields: ['severity'],
      }
    )
    const headers = getApiHeaders(true)
    const response = await this.api.getWithHeaders<RequestLogs[]>(
      `/ai-service/${this.tenant}/agentic/logs/requests${queryString}`,
      { headers }
    )

    const logs = response.data
    const totalCount = parseTotalCount(response.headers)
    const data = logs?.map((log) => this.transformToSummary(log))

    return { data, totalCount }
  }

  async getAgentLogsByRequestId(
    requestId: string
  ): Promise<RequestLogs | null> {
    const headers = getApiHeaders()
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
    const queryString = buildQueryParams(
      {
        sortBy: sortBy || 'metadata.modifiedAt',
        sortOrder: sortOrder || 'DESC',
        pageSize,
        pageNumber,
        agentId,
        filters,
      },
      {
        agentIdField: 'triggerAgentId',
        exactMatchFields: ['severity'],
      }
    )

    const url = `/ai-service/${this.tenant}/agentic/logs/sessions${queryString}`
    const headers = getApiHeaders(true)
    const response = await this.api.getWithHeaders<SessionLogs[]>(url, {
      headers,
    })

    const totalCount = parseTotalCount(response.headers)

    return { data: response.data, totalCount }
  }

  async getSessionById(sessionId: string): Promise<SessionLogs> {
    const headers = getApiHeaders()
    const url = `/ai-service/${this.tenant}/agentic/logs/sessions/${sessionId}`
    const response = await this.api.getWithHeaders<SessionLogs>(url, {
      headers,
    })
    return response.data
  }
}
