// Base interface for common fields
export interface BaseStatisticsApiResponse {
  tenant: string
  maxAllowedUsage?: number
  tenantUsage: {
    summary: any // Will be more specific in derived interfaces
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<any> // Will be more specific in derived interfaces
    }
  }
}

// API Calls specific interface
export interface ApiCallsStatisticsResponse extends BaseStatisticsApiResponse {
  tenantUsage: {
    summary: {
      lastDay: number
      thisWeek: number
      thisMonth: number
      thisYear: number
    }
    range: {
      period: string
      startTime: string
      endTime: string
      values: Array<{
        date: string
        value: number
      }>
    }
  }
}

// Make specific interface
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

// Database specific interface
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

// Cloudinary specific interface
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

// Union type for all statistics responses
export type StatisticsApiResponse = ApiCallsStatisticsResponse | MakeStatisticsResponse | DatabaseStatisticsResponse | CloudinaryStatisticsResponse

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

// Auth-adapter response interfaces
export interface UserTenantApplication {
  id: string
  roles?: string[]
}

export interface UserTenant {
  tenant: string
  applications: UserTenantApplication[]
}

export type UserTenantsResponse = UserTenant[] 