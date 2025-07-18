import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse } from '../models/Statistics.model'

// Utility function to download CSV file
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

// Convert API calls data to CSV format
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
  
  // Sort by date to ensure proper cumulative calculation
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    const apiCalls = item.value || 0
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

// Convert Make data to CSV format
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
  
  // Sort by date to ensure proper cumulative calculation
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

// Convert multiple tenants' API calls data to CSV format
export const convertMultiTenantApiCallsToCSV = (
  tenantData: Record<string, ApiCallsStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'API Calls', 'Cumulative API Calls']
  const csvRows = [headers.join(',')]

  // Get all unique dates
  const allDates = new Set<string>()
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => allDates.add(item.date))
    }
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  // For each tenant, calculate cumulative data
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (!data?.tenantUsage?.range?.values) return

    let cumulativeSum = 0
    const valueMap = new Map<string, number>()
    
    // Create a map of date -> value for this tenant
    data.tenantUsage.range.values.forEach(item => {
      valueMap.set(item.date, item.value || 0)
    })

    // Add rows for each date
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

// Convert multiple tenants' Make data to CSV format
export const convertMultiTenantMakeToCSV = (
  tenantData: Record<string, MakeStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Operations', 'Cumulative Operations', 'Data Transfer (Bytes)', 'Cumulative Data Transfer (Bytes)']
  const csvRows = [headers.join(',')]

  // Get all unique dates
  const allDates = new Set<string>()
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => allDates.add(item.date))
    }
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  // For each tenant, calculate cumulative data
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (!data?.tenantUsage?.range?.values) return

    let cumulativeOperations = 0
    let cumulativeDataTransfer = 0
    const operationsMap = new Map<string, number>()
    const dataTransferMap = new Map<string, number>()
    
    // Create maps of date -> value for this tenant
    data.tenantUsage.range.values.forEach(item => {
      operationsMap.set(item.date, item.operations || 0)
      dataTransferMap.set(item.date, item.dataTransferBytes || 0)
    })

    // Add rows for each date
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

// Convert Database data to CSV format
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
  
  // Sort by date to ensure proper cumulative calculation
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
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

// Convert multi-tenant Database data to CSV format
export const convertMultiTenantDatabaseToCSV = (
  tenantData: Record<string, DatabaseStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Storage (GB)']
  const csvRows = [headers.join(',')]

  // Create a map to store all dates
  const allDates = new Set<string>()
  
  // Collect all unique dates
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  // For each date, add rows for each tenant
  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          // Convert bytes to GB
          const storageGB = (dateItem.totalBytes || 0) / (1024 * 1024 * 1024)
          const row = [date, tenant, storageGB.toFixed(3)]
          csvRows.push(row.join(','))
        }
      }
    })
  })

  return csvRows.join('\n')
} 

// Convert Cloudinary data to CSV format
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
  
  // Sort by date to ensure proper cumulative calculation
  const sortedValues = [...data.tenantUsage.range.values].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedValues.forEach(item => {
    // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
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

// Convert multi-tenant Cloudinary data to CSV format
export const convertMultiTenantCloudinaryToCSV = (
  tenantData: Record<string, CloudinaryStatisticsResponse>,
  selectedTenants: string[]
): string => {
  const headers = ['Date', 'Tenant', 'Storage (GB)', 'Number of Objects']
  const csvRows = [headers.join(',')]

  // Create a map to store all dates
  const allDates = new Set<string>()
  
  // Collect all unique dates
  selectedTenants.forEach(tenant => {
    const data = tenantData[tenant]
    if (data?.tenantUsage?.range?.values) {
      data.tenantUsage.range.values.forEach(item => {
        allDates.add(item.date)
      })
    }
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  // For each date, add rows for each tenant
  sortedDates.forEach(date => {
    selectedTenants.forEach(tenant => {
      const data = tenantData[tenant]
      if (data?.tenantUsage?.range?.values) {
        const dateItem = data.tenantUsage.range.values.find(item => item.date === date)
        if (dateItem) {
          // Convert bytes to GB
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