import { Job, JobSummary } from '../types/Job'
import { AppState } from '../types/common'
import type { CursorPageResult, CursorParams } from '../types/CursorPagination'
import { ApiClient } from './apiClient'
import {
  getApiHeaders,
  buildQueryParams,
  parseCursorHeaders,
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
    agentId?: string,
    filters?: Record<string, string>,
    cursor?: CursorParams | null
  ): Promise<CursorPageResult<JobSummary>> {
    const queryString = buildQueryParams(
      {
        sortBy,
        sortOrder,
        pageSize,
        next: cursor?.next,
        prev: cursor?.prev,
        agentId,
        filters,
      },
      {
        agentIdField: 'agentId',
        exactMatchFields: ['type', 'status'],
      }
    )
    const url = `/ai-service/${this.tenant}/jobs${queryString}`
    const headers = getApiHeaders()

    const response = await this.api.getWithHeaders<Job[]>(url, { headers })
    const jobs = response.data
    const { nextCursor, prevCursor } = parseCursorHeaders(response.headers)

    const data = jobs.map((job) => this.transformToSummary(job))

    return { data, nextCursor, prevCursor }
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
