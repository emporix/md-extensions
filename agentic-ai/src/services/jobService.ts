import { Job, JobSummary } from '../types/Job'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export class JobService {
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
    
    // Build q parameter with filters using regex pattern for flexible matching
    const qParts: string[] = []
    
    // Add agentId filter if provided (for backward compatibility)
    if (params.agentId) {
      qParts.push(`agentId:${params.agentId}`)
    }
    
    // Add column filters with regex pattern: field:~(value)
    if (params.filters) {
      Object.entries(params.filters).forEach(([field, value]) => {
        if (value && value.trim()) {
          qParts.push(`${field}:~(${value.trim()})`)
        }
      })
    }
    
    // Combine all q parts with space separator
    if (qParts.length > 0) {
      queryParams.append('q', qParts.join(' '))
    }

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Transform full job to summary format
   */
  private transformToSummary(job: Job): JobSummary {
    return {
      id: job.id,
      status: job.status,
      requestId: job.requestId,
      sessionId: job.sessionId,
      agentType: job.agentType,
      agentId: job.agentId,
      message: job.message,
      response: job.response,
      type: job.type,
      importResult: job.importResult,
      exportResult: job.exportResult,
      createdAt: job.metadata.createdAt,
    }
  }

  async getJobs(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    pageSize?: number,
    pageNumber?: number,
    agentId?: string,
    filters?: Record<string, string>
  ): Promise<{ data: JobSummary[]; totalCount: number }> {
    const queryString = this.buildQueryParams({
      sortBy,
      sortOrder,
      pageSize,
      pageNumber,
      agentId,
      filters,
    })
    const url = `/ai-service/${this.tenant}/jobs${queryString}`
    const headers = this.getHeaders(true)

    const response = await this.api.getWithHeaders<Job[]>(url, { headers })
    const jobs = response.data
    const totalCount = parseInt(
      response.headers.get('x-total-count') || '0',
      10
    )

    const data = jobs.map((job) => this.transformToSummary(job))

    return { data, totalCount }
  }

  async getJobDetails(jobId: string): Promise<Job> {
    const headers = this.getHeaders()
    const response = await this.api.getWithHeaders<Job>(
      `/ai-service/${this.tenant}/jobs/${jobId}`,
      { headers }
    )
    return response.data
  }
}
