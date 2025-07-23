import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, AiStatisticsResponse, WebhooksStatisticsResponse, StatisticsSummary } from '../models/Statistics.model'
import { 
  downloadCSV, 
  convertApiCallsToCSV, 
  convertMakeToCSV,
  convertDatabaseToCSV,
  convertCloudinaryToCSV,
  convertAiToCSV,
  convertWebhooksToCSV,
  convertMultiTenantApiCallsToCSV,
  convertMultiTenantMakeToCSV,
  convertMultiTenantDatabaseToCSV,
  convertMultiTenantCloudinaryToCSV,
  convertMultiTenantAiToCSV,
  convertMultiTenantWebhooksToCSV 
} from './csvUtils'
import { aggregateApiCallsData, aggregateMakeData, aggregateDatabaseData, aggregateCloudinaryData, aggregateAiData, aggregateWebhooksData } from './aggregationUtils'

export const createCsvDownloadHandlers = (
  selectedTenants: string[],
  statisticsData: Record<string, ApiCallsStatisticsResponse>,
  makeStatisticsData: Record<string, MakeStatisticsResponse>,
  databaseStatisticsData: Record<string, DatabaseStatisticsResponse>,
  cloudinaryStatisticsData: Record<string, CloudinaryStatisticsResponse>,
  aiStatisticsData: Record<string, AiStatisticsResponse>,
  webhooksStatisticsData: Record<string, WebhooksStatisticsResponse>,
  summary: Record<string, StatisticsSummary>,
  makeSummary: Record<string, StatisticsSummary>,
  databaseSummary: Record<string, StatisticsSummary>,
  cloudinarySummary: Record<string, StatisticsSummary>,
  aiInputSummary: Record<string, StatisticsSummary>,
  aiOutputSummary: Record<string, StatisticsSummary>,
  webhooksSummary: Record<string, StatisticsSummary>
) => {
  const getAggregatedApiCallsData = () => {
    return aggregateApiCallsData(selectedTenants, statisticsData, summary)
  }

  const getAggregatedMakeData = () => {
    return aggregateMakeData(selectedTenants, makeStatisticsData, makeSummary)
  }

  const getAggregatedDatabaseData = () => {
    return aggregateDatabaseData(selectedTenants, databaseStatisticsData, databaseSummary)
  }

  const getAggregatedCloudinaryData = () => {
    return aggregateCloudinaryData(selectedTenants, cloudinaryStatisticsData, cloudinarySummary)
  }

  const getAggregatedAiData = () => {
    return aggregateAiData(selectedTenants, aiStatisticsData, aiInputSummary, aiOutputSummary)
  }

  const getAggregatedWebhooksData = () => {
    return aggregateWebhooksData(selectedTenants, webhooksStatisticsData, webhooksSummary)
  }

  const handleDownloadApiCallsCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedApiCallsData().data
      : statisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantApiCallsToCSV(statisticsData, selectedTenants)
      const filename = `api-calls-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertApiCallsToCSV(tenantData, tenantName)
      const filename = `api-calls-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  const handleDownloadMakeCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedMakeData().data
      : makeStatisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantMakeToCSV(makeStatisticsData, selectedTenants)
      const filename = `make-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertMakeToCSV(tenantData, tenantName)
      const filename = `make-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  const handleDownloadDatabaseCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedDatabaseData().data
      : databaseStatisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantDatabaseToCSV(databaseStatisticsData, selectedTenants)
      const filename = `database-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertDatabaseToCSV(tenantData, tenantName)
      const filename = `database-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  const handleDownloadCloudinaryCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedCloudinaryData().data
      : cloudinaryStatisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantCloudinaryToCSV(cloudinaryStatisticsData, selectedTenants)
      const filename = `cloudinary-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertCloudinaryToCSV(tenantData, tenantName)
      const filename = `cloudinary-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  const handleDownloadAiCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedAiData().data
      : aiStatisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantAiToCSV(aiStatisticsData, selectedTenants)
      const filename = `ai-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertAiToCSV(tenantData, tenantName)
      const filename = `ai-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  const handleDownloadWebhooksCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedWebhooksData().data
      : webhooksStatisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      const csvContent = convertMultiTenantWebhooksToCSV(webhooksStatisticsData, selectedTenants)
      const filename = `webhooks-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      const csvContent = convertWebhooksToCSV(tenantData, tenantName)
      const filename = `webhooks-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  return {
    handleDownloadApiCallsCSV,
    handleDownloadMakeCSV,
    handleDownloadDatabaseCSV,
    handleDownloadCloudinaryCSV,
    handleDownloadAiCSV,
    handleDownloadWebhooksCSV,
    getAggregatedApiCallsData,
    getAggregatedMakeData,
    getAggregatedDatabaseData,
    getAggregatedCloudinaryData,
    getAggregatedAiData,
    getAggregatedWebhooksData,
  }
} 