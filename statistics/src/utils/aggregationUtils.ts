import { ApiCallsStatisticsResponse, MakeStatisticsResponse, StatisticsSummary } from '../models/Statistics.model'

// Generic aggregation function for API calls data
export const aggregateApiCallsData = (
  selectedTenants: string[],
  tenantData: Record<string, ApiCallsStatisticsResponse>,
  tenantSummaries: Record<string, StatisticsSummary>
): { data: ApiCallsStatisticsResponse | null; summary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validTenantSummaries = selectedTenants.map(tenant => tenantSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  // Aggregate summary data
  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  // Create aggregated chart data
  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  // Create a map to aggregate values by date
  const dateValueMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    data.tenantUsage.range.values.forEach(item => {
      const currentValue = dateValueMap.get(item.date) || 0
      dateValueMap.set(item.date, currentValue + (item.value || 0))
    })
  })

  // Create aggregated data structure
  const aggregatedData: ApiCallsStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedUsage: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        lastDay: aggregatedSummary.yesterday,
        thisWeek: aggregatedSummary.thisWeek,
        thisMonth: aggregatedSummary.thisMonth,
        thisYear: aggregatedSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          value: dateValueMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
}

// Generic aggregation function for Make data
export const aggregateMakeData = (
  selectedTenants: string[],
  tenantData: Record<string, MakeStatisticsResponse>,
  tenantSummaries: Record<string, StatisticsSummary>
): { data: MakeStatisticsResponse | null; summary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validTenantSummaries = selectedTenants.map(tenant => tenantSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  // Aggregate summary data
  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  // Create aggregated chart data
  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  // Create a map to aggregate values by date
  const dateOperationsMap = new Map<string, number>()
  const dateDataTransferMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    data.tenantUsage.range.values.forEach(item => {
      const currentOperations = dateOperationsMap.get(item.date) || 0
      const currentDataTransfer = dateDataTransferMap.get(item.date) || 0
      dateOperationsMap.set(item.date, currentOperations + (item.operations || 0))
      dateDataTransferMap.set(item.date, currentDataTransfer + (item.dataTransferBytes || 0))
    })
  })

  // Calculate aggregated data transfer bytes for summary
  const aggregatedDataTransfer = {
    lastDay: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesLastDay || 0), 0),
    thisWeek: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisWeek || 0), 0),
    thisMonth: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisMonth || 0), 0),
    thisYear: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisYear || 0), 0),
  }

  // Create aggregated data structure
  const aggregatedData: MakeStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedUsage: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        operationsLastDay: aggregatedSummary.yesterday,
        operationsThisWeek: aggregatedSummary.thisWeek,
        operationsThisMonth: aggregatedSummary.thisMonth,
        operationsThisYear: aggregatedSummary.thisYear,
        dataTransferBytesLastDay: aggregatedDataTransfer.lastDay,
        dataTransferBytesThisWeek: aggregatedDataTransfer.thisWeek,
        dataTransferBytesThisMonth: aggregatedDataTransfer.thisMonth,
        dataTransferBytesThisYear: aggregatedDataTransfer.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          operations: dateOperationsMap.get(item.date) || 0,
          dataTransferBytes: dateDataTransferMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
} 