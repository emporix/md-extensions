export interface BaseStatisticsApiResponse {
  tenant: string
  maxAllowedUsage?: number
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