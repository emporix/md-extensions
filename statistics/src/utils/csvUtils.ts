import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, AiStatisticsResponse, WebhooksStatisticsResponse } from '../models/Statistics.model'

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const convertApiCallsToCSV = (
  data: ApiCallsStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'API Calls', 'Cumulative API Calls']
  const csvRows = [headers.join(',')]

  let cumulativeSum = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const apiCalls = item.requestsCount || 0
    cumulativeSum += apiCalls
    
    const row = [
      item.date,
      tenantName,
      apiCalls.toString(),
      cumulativeSum.toString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMakeToCSV = (
  data: MakeStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'Operations', 'Cumulative Operations', 'Data Transfer (Bytes)', 'Cumulative Data Transfer (Bytes)']
  const csvRows = [headers.join(',')]

  let cumulativeOperations = 0
  let cumulativeDataTransfer = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const operations = item.operations || 0
    const dataTransfer = item.dataTransferBytes || 0
    cumulativeOperations += operations
    cumulativeDataTransfer += dataTransfer
    
    const row = [
      item.date,
      tenantName,
      operations.toString(),
      cumulativeOperations.toString(),
      dataTransfer.toString(),
      cumulativeDataTransfer.toString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMultiTenantApiCallsToCSV = (
  tenantData: Record<string, ApiCallsStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'API Calls', 'Cumulative API Calls']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => allDates.add(item.date))
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (!data?.tenantUsage?.range?.values) return

    let cumulativeSum = 0
    const valueMap = new Map<string, number>()
    
    data.tenantUsage.range.values.forEach(item => {
      valueMap.set(item.date, item.requestsCount || 0)
    })

    sortedDates.forEach(date => {
      const apiCalls = valueMap.get(date) || 0
      cumulativeSum += apiCalls
      
      const row = [
        date,
        tenant,
        apiCalls.toString(),
        cumulativeSum.toString()
      ]
      csvRows.push(row.join(','))
    })
  })

  return csvRows.join('\n')
}

export const convertMultiTenantMakeToCSV = (
  tenantData: Record<string, MakeStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Operations', 'Cumulative Operations', 'Data Transfer (Bytes)', 'Cumulative Data Transfer (Bytes)']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => allDates.add(item.date))
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (!data?.tenantUsage?.range?.values) return

    let cumulativeOperations = 0
    let cumulativeDataTransfer = 0
    const operationsMap = new Map<string, number>()
    const dataTransferMap = new Map<string, number>()
    
    data.tenantUsage.range.values.forEach(item => {
      operationsMap.set(item.date, item.operations || 0)
      dataTransferMap.set(item.date, item.dataTransferBytes || 0)
    })

    sortedDates.forEach(date => {
      const operations = operationsMap.get(date) || 0
      const dataTransfer = dataTransferMap.get(date) || 0
      cumulativeOperations += operations
      cumulativeDataTransfer += dataTransfer
      
      const row = [
        date,
        tenant,
        operations.toString(),
        cumulativeOperations.toString(),
        dataTransfer.toString(),
        cumulativeDataTransfer.toString()
      ]
      csvRows.push(row.join(','))
    })
  })

  return csvRows.join('\n')
} 

export const convertDatabaseToCSV = (
  data: DatabaseStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'Storage (GB)', 'Cumulative Storage (GB)']
  const csvRows = [headers.join(',')]

  let cumulativeStorage = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const storageGB = (item.totalBytes || 0) / (1024 * 1024 * 1024)
    cumulativeStorage += storageGB
    
    const row = [
      item.date,
      tenantName,
      storageGB.toFixed(3),
      cumulativeStorage.toFixed(3)
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMultiTenantDatabaseToCSV = (
  tenantData: Record<string, DatabaseStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Storage (GB)']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          const storageGB = (dateItem.totalBytes || 0) / (1024 * 1024 * 1024)
          const row = [date, tenant, storageGB.toFixed(3)]
          csvRows.push(row.join(','))
        }
      }
    })
  })

  return csvRows.join('\n')
} 

export const convertCloudinaryToCSV = (
  data: CloudinaryStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'Storage (GB)', 'Cumulative Storage (GB)', 'Number of Objects', 'Cumulative Objects']
  const csvRows = [headers.join(',')]

  let cumulativeStorage = 0
  let cumulativeObjects = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const storageGB = (item.storageBytes || 0) / (1024 * 1024 * 1024)
    const objects = item.numberOfObjects || 0
    cumulativeStorage += storageGB
    cumulativeObjects += objects
    
    const row = [
      item.date,
      tenantName,
      storageGB.toFixed(3),
      cumulativeStorage.toFixed(3),
      objects.toString(),
      cumulativeObjects.toString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMultiTenantCloudinaryToCSV = (
  tenantData: Record<string, CloudinaryStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Storage (GB)', 'Number of Objects']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          const storageGB = (dateItem.storageBytes || 0) / (1024 * 1024 * 1024)
          const objects = dateItem.numberOfObjects || 0
          const row = [date, tenant, storageGB.toFixed(3), objects.toString()]
          csvRows.push(row.join(','))
        }
      }
    })
  })

  return csvRows.join('\n')
} 

export const convertAiToCSV = (
  data: AiStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'Input Tokens', 'Cumulative Input Tokens', 'Output Tokens', 'Cumulative Output Tokens']
  const csvRows = [headers.join(',')]

  let cumulativeInput = 0
  let cumulativeOutput = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const inputTokens = item.inputUsage || 0
    const outputTokens = item.outputUsage || 0
    cumulativeInput += inputTokens
    cumulativeOutput += outputTokens
    
    const row = [
      item.date,
      tenantName,
      inputTokens.toString(),
      cumulativeInput.toString(),
      outputTokens.toString(),
      cumulativeOutput.toString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMultiTenantAiToCSV = (
  tenantData: Record<string, AiStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Input Tokens', 'Output Tokens']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          const inputTokens = dateItem.inputUsage || 0
          const outputTokens = dateItem.outputUsage || 0
          const row = [date, tenant, inputTokens.toString(), outputTokens.toString()]
          csvRows.push(row.join(','))
        }
      }
    })
  })

  return csvRows.join('\n')
} 

export const convertWebhooksToCSV = (
  data: WebhooksStatisticsResponse | null,
  tenantName: string = 'Unknown'
): string => {
  if (!data || !data.tenantUsage?.range?.values) {
    return 'No data available'
  }

  const headers = ['Date', 'Tenant', 'Emitted Events', 'Cumulative Emitted Events']
  const csvRows = [headers.join(',')]

  let cumulativeEvents = 0
  
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const events = item.emittedEvents || 0
    cumulativeEvents += events
    
    const row = [
      item.date,
      tenantName,
      events.toString(),
      cumulativeEvents.toString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export const convertMultiTenantWebhooksToCSV = (
  tenantData: Record<string, WebhooksStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Emitted Events']
  const csvRows = [headers.join(',')]

  const allDates = new Set<string>()
  
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          const events = dateItem.emittedEvents || 0
          const row = [date, tenant, events.toString()]
          csvRows.push(row.join(','))
        }
      }
    })
  })

  return csvRows.join('\n')
} 