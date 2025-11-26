import { Job, JobSummary } from '../types/Job'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import {
  getApiHeaders,
  buildQueryParams,
  parseTotalCount,
} from '../utils/apiHelpers'

export class JobService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

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
        agentIdField: 'agentId',
        exactMatchFields: ['type', 'status'],
      }
    )
    const url = `/ai-service/${this.tenant}/jobs${queryString}`
    const headers = getApiHeaders(true)

    const response = await this.api.getWithHeaders<Job[]>(url, { headers })
    const jobs = response.data
    const totalCount = parseTotalCount(response.headers)

    const data = jobs.map((job) => this.transformToSummary(job))

    return { data, totalCount }
  }

  async getJobDetails(jobId: string): Promise<Job> {
    const headers = getApiHeaders()
    const response = await this.api.getWithHeaders<Job>(
      `/ai-service/${this.tenant}/jobs/${jobId}`,
      { headers }
    )
    return response.data
  }
}
