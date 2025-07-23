import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, AiStatisticsResponse, WebhooksStatisticsResponse, StatisticsSummary } from '../models/Statistics.model'

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

  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  const dateValueMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentValue = dateValueMap.get(item.date) || 0
      dateValueMap.set(item.date, currentValue + (item.requestsCount || 0))
    })
  })

  const aggregatedData: ApiCallsStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedRequests: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        requestsCountLastDay: aggregatedSummary.yesterday,
        requestsCountThisWeek: aggregatedSummary.thisWeek,
        requestsCountThisMonth: aggregatedSummary.thisMonth,
        requestsCountThisYear: aggregatedSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          requestsCount: dateValueMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
}

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

  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  const dateOperationsMap = new Map<string, number>()
  const dateDataTransferMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentOperations = dateOperationsMap.get(item.date) || 0
      const currentDataTransfer = dateDataTransferMap.get(item.date) || 0
      dateOperationsMap.set(item.date, currentOperations + (item.operations || 0))
      dateDataTransferMap.set(item.date, currentDataTransfer + (item.dataTransferBytes || 0))
    })
  })

  const aggregatedDataTransfer = {
    lastDay: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesLastDay || 0), 0),
    thisWeek: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisWeek || 0), 0),
    thisMonth: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisMonth || 0), 0),
    thisYear: validTenantData.reduce((sum, data) => sum + (data.tenantUsage.summary.dataTransferBytesThisYear || 0), 0),
  }

  const aggregatedData: MakeStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedOperations: aggregatedSummary.agreedAnnual,
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

export const aggregateDatabaseData = (
  selectedTenants: string[],
  tenantData: Record<string, DatabaseStatisticsResponse>,
  tenantSummaries: Record<string, StatisticsSummary>
): { data: DatabaseStatisticsResponse | null; summary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validTenantSummaries = selectedTenants.map(tenant => tenantSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  const dateTotalBytesMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentValue = dateTotalBytesMap.get(item.date) || 0
      dateTotalBytesMap.set(item.date, currentValue + (item.totalBytes || 0))
    })
  })

  const aggregatedData: DatabaseStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedStorageBytes: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        totalBytesLastDay: aggregatedSummary.yesterday,
        totalBytesThisWeek: aggregatedSummary.thisWeek,
        totalBytesThisMonth: aggregatedSummary.thisMonth,
        totalBytesThisYear: aggregatedSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          totalBytes: dateTotalBytesMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
} 

export const aggregateCloudinaryData = (
  selectedTenants: string[],
  tenantData: Record<string, CloudinaryStatisticsResponse>,
  tenantSummaries: Record<string, StatisticsSummary>
): { data: CloudinaryStatisticsResponse | null; summary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validTenantSummaries = selectedTenants.map(tenant => tenantSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  const dateStorageBytesMap = new Map<string, number>()
  const dateNumberOfObjectsMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentStorageBytes = dateStorageBytesMap.get(item.date) || 0
      const currentNumberOfObjects = dateNumberOfObjectsMap.get(item.date) || 0
      dateStorageBytesMap.set(item.date, currentStorageBytes + (item.storageBytes || 0))
      dateNumberOfObjectsMap.set(item.date, currentNumberOfObjects + (item.numberOfObjects || 0))
    })
  })

  const aggregatedData: CloudinaryStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedStorageBytes: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        numberOfObjectsLastDay: aggregatedSummary.yesterday,
        numberOfObjectsThisWeek: aggregatedSummary.thisWeek,
        numberOfObjectsThisMonth: aggregatedSummary.thisMonth,
        numberOfObjectsThisYear: aggregatedSummary.thisYear,
        storageBytesLastDay: aggregatedSummary.yesterday,
        storageBytesThisWeek: aggregatedSummary.thisWeek,
        storageBytesThisMonth: aggregatedSummary.thisMonth,
        storageBytesThisYear: aggregatedSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          numberOfObjects: dateNumberOfObjectsMap.get(item.date) || 0,
          storageBytes: dateStorageBytesMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
} 

export const aggregateAiData = (
  selectedTenants: string[],
  tenantData: Record<string, AiStatisticsResponse>,
  inputSummaries: Record<string, StatisticsSummary>,
  outputSummaries: Record<string, StatisticsSummary>
): { data: AiStatisticsResponse | null; inputSummary: StatisticsSummary; outputSummary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { 
      data: null, 
      inputSummary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
      outputSummary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 }
    }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validInputSummaries = selectedTenants.map(tenant => inputSummaries[tenant]).filter(Boolean)  
  const validOutputSummaries = selectedTenants.map(tenant => outputSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { 
      data: null, 
      inputSummary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
      outputSummary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 }
    }
  }

  const aggregatedInputSummary: StatisticsSummary = {
    yesterday: validInputSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validInputSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validInputSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validInputSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validInputSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const aggregatedOutputSummary: StatisticsSummary = {
    yesterday: validOutputSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validOutputSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validOutputSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validOutputSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validOutputSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, inputSummary: aggregatedInputSummary, outputSummary: aggregatedOutputSummary }
  }

  const dateInputUsageMap = new Map<string, number>()
  const dateOutputUsageMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentInputUsage = dateInputUsageMap.get(item.date) || 0
      const currentOutputUsage = dateOutputUsageMap.get(item.date) || 0
      dateInputUsageMap.set(item.date, currentInputUsage + (item.inputUsage || 0))
      dateOutputUsageMap.set(item.date, currentOutputUsage + (item.outputUsage || 0))
    })
  })

  const aggregatedData: AiStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedAiInput: aggregatedInputSummary.agreedAnnual,
    maxAllowedAiOutput: aggregatedOutputSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        inputUsageLastDay: aggregatedInputSummary.yesterday,
        inputUsageThisWeek: aggregatedInputSummary.thisWeek,
        inputUsageThisMonth: aggregatedInputSummary.thisMonth,
        inputUsageThisYear: aggregatedInputSummary.thisYear,
        outputUsageLastDay: aggregatedOutputSummary.yesterday,
        outputUsageThisWeek: aggregatedOutputSummary.thisWeek,
        outputUsageThisMonth: aggregatedOutputSummary.thisMonth,
        outputUsageThisYear: aggregatedOutputSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          inputUsage: dateInputUsageMap.get(item.date) || 0,
          outputUsage: dateOutputUsageMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, inputSummary: aggregatedInputSummary, outputSummary: aggregatedOutputSummary }
} 

export const aggregateWebhooksData = (
  selectedTenants: string[],
  tenantData: Record<string, WebhooksStatisticsResponse>,
  tenantSummaries: Record<string, StatisticsSummary>
): { data: WebhooksStatisticsResponse | null; summary: StatisticsSummary } => {
  if (selectedTenants.length <= 1) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const validTenantData = selectedTenants.map(tenant => tenantData[tenant]).filter(Boolean)
  const validTenantSummaries = selectedTenants.map(tenant => tenantSummaries[tenant]).filter(Boolean)

  if (validTenantData.length === 0) {
    return { data: null, summary: { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 } }
  }

  const aggregatedSummary: StatisticsSummary = {
    yesterday: validTenantSummaries.reduce((sum, s) => sum + (s.yesterday || 0), 0),
    thisWeek: validTenantSummaries.reduce((sum, s) => sum + (s.thisWeek || 0), 0),
    thisMonth: validTenantSummaries.reduce((sum, s) => sum + (s.thisMonth || 0), 0),
    thisYear: validTenantSummaries.reduce((sum, s) => sum + (s.thisYear || 0), 0),
    agreedAnnual: validTenantSummaries.reduce((sum, s) => sum + (s.agreedAnnual || 0), 0),
  }

  const firstTenantData = validTenantData[0]
  if (!firstTenantData?.tenantUsage?.range?.values) {
    return { data: null, summary: aggregatedSummary }
  }

  const dateEmittedEventsMap = new Map<string, number>()
  
  validTenantData.forEach(data => {
    if (!data?.tenantUsage?.range?.values) return;
    data.tenantUsage.range.values.forEach(item => {
      const currentValue = dateEmittedEventsMap.get(item.date) || 0
      dateEmittedEventsMap.set(item.date, currentValue + (item.emittedEvents || 0))
    })
  })

  const aggregatedData: WebhooksStatisticsResponse = {
    tenant: 'aggregated',
    maxAllowedEmittedEvents: aggregatedSummary.agreedAnnual,
    tenantUsage: {
      summary: {
        emittedEventsLastDay: aggregatedSummary.yesterday,
        emittedEventsThisWeek: aggregatedSummary.thisWeek,
        emittedEventsThisMonth: aggregatedSummary.thisMonth,
        emittedEventsThisYear: aggregatedSummary.thisYear,
      },
      range: {
        period: firstTenantData.tenantUsage.range.period,
        startTime: firstTenantData.tenantUsage.range.startTime,
        endTime: firstTenantData.tenantUsage.range.endTime,
        values: firstTenantData.tenantUsage.range.values.map(item => ({
          date: item.date,
          emittedEvents: dateEmittedEventsMap.get(item.date) || 0,
        })),
      },
    },
  }

  return { data: aggregatedData, summary: aggregatedSummary }
} 