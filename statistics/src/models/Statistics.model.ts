export interface BaseStatisticsApiResponse {
  tenant: string
  tenantUsage: {
    summary: any
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<any>
    }
  }
}

export interface ApiCallsStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedRequests?: number
  tenantUsage: {
    summary: {
      requestsCountLastDay: number
      requestsCountThisWeek: number
      requestsCountThisMonth: number
      requestsCountThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        requestsCount: number
      }>
    }
  }
}

export interface ApiCallsExpandedStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedRequests?: number
  tenantUsage: {
    summary: {
      requestsCountLastDay: number
      requestsCountThisWeek: number
      requestsCountThisMonth: number
      requestsCountThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        requestsCount: number
        apiproxy?: string
      }>
    }
  }
}

export interface MakeStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedUsage?: number
  maxAllowedOperations?: number
  tenantUsage: {
    summary: {
      operationsLastDay: number
      operationsThisWeek: number
      operationsThisMonth: number
      operationsThisYear: number
      dataTransferBytesLastDay: number
      dataTransferBytesThisWeek: number
      dataTransferBytesThisMonth: number
      dataTransferBytesThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        operations: number
        dataTransferBytes: number
      }>
    }
  }
}

export interface DatabaseStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedUsage?: number
  maxAllowedStorageBytes?: number
  tenantUsage: {
    summary: {
      totalBytesLastDay: number
      totalBytesThisWeek: number
      totalBytesThisMonth: number
      totalBytesThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        totalBytes: number
      }>
    }
  }
}

export interface CloudinaryStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedUsage?: number
  maxAllowedStorageBytes?: number
  tenantUsage: {
    summary: {
      numberOfObjectsLastDay: number
      numberOfObjectsThisWeek: number
      numberOfObjectsThisMonth: number
      numberOfObjectsThisYear: number
      storageBytesLastDay: number
      storageBytesThisWeek: number
      storageBytesThisMonth: number
      storageBytesThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        numberOfObjects: number
        storageBytes: number
      }>
    }
  }
}

export interface AiStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedUsage?: number
  maxAllowedAiInput?: number
  maxAllowedAiOutput?: number
  tenantUsage: {
    summary: {
      inputUsageLastDay: number
      inputUsageThisWeek: number
      inputUsageThisMonth: number
      inputUsageThisYear: number
      outputUsageLastDay: number
      outputUsageThisWeek: number
      outputUsageThisMonth: number
      outputUsageThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        inputUsage: number
        outputUsage: number
      }>
    }
  }
}

export interface WebhooksStatisticsResponse extends BaseStatisticsApiResponse {
  maxAllowedUsage?: number
  maxAllowedEmittedEvents?: number
  tenantUsage: {
    summary: {
      emittedEventsLastDay: number
      emittedEventsThisWeek: number
      emittedEventsThisMonth: number
      emittedEventsThisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        emittedEvents: number
      }>
    }
  }
}

export type StatisticsApiResponse = ApiCallsStatisticsResponse | MakeStatisticsResponse | DatabaseStatisticsResponse | CloudinaryStatisticsResponse | AiStatisticsResponse | WebhooksStatisticsResponse

export interface StatisticsSummary {
  yesterday: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  agreedAnnual: number
}

export type TimeUnit = 'day' | 'week' | 'month'

export interface StatisticsFilters {
  timeUnit: TimeUnit
  startTime: string
  endTime: string
}

export interface UserTenantApplication {
  id: string
  roles?: string[]
}

export interface UserTenant {
  tenant: string
  applications: UserTenantApplication[]
}

export type UserTenantsResponse = UserTenant[] 