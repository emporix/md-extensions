import { useState } from 'react'
import { fetchStatistics, fetchMakeStatistics, fetchDatabaseStatistics, fetchCloudinaryStatistics, fetchAiStatistics, fetchWebhooksStatistics } from '../api'
import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, AiStatisticsResponse, WebhooksStatisticsResponse, StatisticsFilters, StatisticsSummary } from '../models/Statistics.model'

export const useStatisticsData = (
  tenant: string,
  token: string,
  selectedTenants: string[]
) => {
  const [statisticsData, setStatisticsData] = useState<Record<string, ApiCallsStatisticsResponse>>({})
  const [makeStatisticsData, setMakeStatisticsData] = useState<Record<string, MakeStatisticsResponse>>({})
  const [databaseStatisticsData, setDatabaseStatisticsData] = useState<Record<string, DatabaseStatisticsResponse>>({})
  const [cloudinaryStatisticsData, setCloudinaryStatisticsData] = useState<Record<string, CloudinaryStatisticsResponse>>({})
  const [aiStatisticsData, setAiStatisticsData] = useState<Record<string, AiStatisticsResponse>>({})
  const [webhooksStatisticsData, setWebhooksStatisticsData] = useState<Record<string, WebhooksStatisticsResponse>>({})
  const [summary, setSummary] = useState<Record<string, StatisticsSummary>>({})
  const [makeSummary, setMakeSummary] = useState<Record<string, StatisticsSummary>>({})
  const [databaseSummary, setDatabaseSummary] = useState<Record<string, StatisticsSummary>>({})
  const [cloudinarySummary, setCloudinarySummary] = useState<Record<string, StatisticsSummary>>({})
  const [aiInputSummary, setAiInputSummary] = useState<Record<string, StatisticsSummary>>({})
  const [aiOutputSummary, setAiOutputSummary] = useState<Record<string, StatisticsSummary>>({})
  const [webhooksSummary, setWebhooksSummary] = useState<Record<string, StatisticsSummary>>({})

  const fetchApiCallsData = async (filters: StatisticsFilters) => {
    try {
      const newStatisticsData: Record<string, ApiCallsStatisticsResponse> = {}
      const newSummary: Record<string, StatisticsSummary> = {}
      
      for (const selectedTenant of selectedTenants) {
        const apiData = await fetchStatistics(tenant, selectedTenant, token, filters)
        newStatisticsData[selectedTenant] = apiData
        
        newSummary[selectedTenant] = {
          yesterday: apiData?.tenantUsage?.summary?.requestsCountLastDay || 0,
          thisWeek: apiData?.tenantUsage?.summary?.requestsCountThisWeek || 0,
          thisMonth: apiData?.tenantUsage?.summary?.requestsCountThisMonth || 0,
          thisYear: apiData?.tenantUsage?.summary?.requestsCountThisYear || 0,
          agreedAnnual: apiData?.maxAllowedUsage || 0,
        }
      }
      
      setStatisticsData(newStatisticsData)
      setSummary(newSummary)
    } catch (error) {
      console.error('Error fetching API statistics:', error)
    }
  }

  const fetchMakeData = async (filters: StatisticsFilters) => {
    try {
      const newMakeStatisticsData: Record<string, MakeStatisticsResponse> = {}
      const newMakeSummary: Record<string, StatisticsSummary> = {}
      
      for (const selectedTenant of selectedTenants) {
        const makeData = await fetchMakeStatistics(tenant, selectedTenant, token, filters)
        newMakeStatisticsData[selectedTenant] = makeData
        
        newMakeSummary[selectedTenant] = {
          yesterday: makeData?.tenantUsage?.summary?.operationsLastDay || 0,
          thisWeek: makeData?.tenantUsage?.summary?.operationsThisWeek || 0,
          thisMonth: makeData?.tenantUsage?.summary?.operationsThisMonth || 0,
          thisYear: makeData?.tenantUsage?.summary?.operationsThisYear || 0,
          agreedAnnual: makeData?.maxAllowedUsage || 0,
        }
      }
      
      setMakeStatisticsData(newMakeStatisticsData)
      setMakeSummary(newMakeSummary)
    } catch (error) {
      console.error('Error fetching Make statistics:', error)
    }
  }

  const fetchDatabaseData = async (filters: StatisticsFilters) => {
    try {
      const newDatabaseStatisticsData: Record<string, DatabaseStatisticsResponse> = {}
      const newDatabaseSummary: Record<string, StatisticsSummary> = {}

      for (const selectedTenant of selectedTenants) {
        const databaseData = await fetchDatabaseStatistics(tenant, selectedTenant, token, filters)
        newDatabaseStatisticsData[selectedTenant] = databaseData

         newDatabaseSummary[selectedTenant] = {
           yesterday: databaseData?.tenantUsage?.summary?.totalBytesLastDay || 0,
           thisWeek: databaseData?.tenantUsage?.summary?.totalBytesThisWeek || 0,
           thisMonth: databaseData?.tenantUsage?.summary?.totalBytesThisMonth || 0,
           thisYear: databaseData?.tenantUsage?.summary?.totalBytesThisYear || 0,
           agreedAnnual: databaseData?.maxAllowedUsage || 0,
         }
      }

      setDatabaseStatisticsData(newDatabaseStatisticsData)
      setDatabaseSummary(newDatabaseSummary)
    } catch (error) {
      console.error('Error fetching Database statistics:', error)
    }
  }

  const fetchCloudinaryData = async (filters: StatisticsFilters) => {
    try {
      const newCloudinaryStatisticsData: Record<string, CloudinaryStatisticsResponse> = {}
      const newCloudinarySummary: Record<string, StatisticsSummary> = {}

      for (const selectedTenant of selectedTenants) {
        const cloudinaryData = await fetchCloudinaryStatistics(tenant, selectedTenant, token, filters)
        newCloudinaryStatisticsData[selectedTenant] = cloudinaryData

         newCloudinarySummary[selectedTenant] = {
           yesterday: cloudinaryData?.tenantUsage?.summary?.storageBytesLastDay || 0,
           thisWeek: cloudinaryData?.tenantUsage?.summary?.storageBytesThisWeek || 0,
           thisMonth: cloudinaryData?.tenantUsage?.summary?.storageBytesThisMonth || 0,
           thisYear: cloudinaryData?.tenantUsage?.summary?.storageBytesThisYear || 0,
           agreedAnnual: cloudinaryData?.maxAllowedUsage || 0,
         }
      }

      setCloudinaryStatisticsData(newCloudinaryStatisticsData)
      setCloudinarySummary(newCloudinarySummary)
    } catch (error) {
      console.error('Error fetching Cloudinary statistics:', error)
    }
  }

  const fetchAiData = async (filters: StatisticsFilters) => {
    try {
      const newAiStatisticsData: Record<string, AiStatisticsResponse> = {}
      const newAiInputSummary: Record<string, StatisticsSummary> = {}
      const newAiOutputSummary: Record<string, StatisticsSummary> = {}

      for (const selectedTenant of selectedTenants) {
        const aiData = await fetchAiStatistics(tenant, selectedTenant, token, filters)
        newAiStatisticsData[selectedTenant] = aiData

         newAiInputSummary[selectedTenant] = {
           yesterday: aiData?.tenantUsage?.summary?.inputUsageLastDay || 0,
           thisWeek: aiData?.tenantUsage?.summary?.inputUsageThisWeek || 0,
           thisMonth: aiData?.tenantUsage?.summary?.inputUsageThisMonth || 0,
           thisYear: aiData?.tenantUsage?.summary?.inputUsageThisYear || 0,
           agreedAnnual: aiData?.maxAllowedUsage || 0,
         }
         newAiOutputSummary[selectedTenant] = {
           yesterday: aiData?.tenantUsage?.summary?.outputUsageLastDay || 0,
           thisWeek: aiData?.tenantUsage?.summary?.outputUsageThisWeek || 0,
           thisMonth: aiData?.tenantUsage?.summary?.outputUsageThisMonth || 0,
           thisYear: aiData?.tenantUsage?.summary?.outputUsageThisYear || 0,
           agreedAnnual: aiData?.maxAllowedUsage || 0,
         }
      }

      setAiStatisticsData(newAiStatisticsData)
      setAiInputSummary(newAiInputSummary)
      setAiOutputSummary(newAiOutputSummary)
    } catch (error) {
      console.error('Error fetching AI statistics:', error)
    }
  }

  const fetchWebhooksData = async (filters: StatisticsFilters) => {
    try {
      const newWebhooksStatisticsData: Record<string, WebhooksStatisticsResponse> = {}
      const newWebhooksSummary: Record<string, StatisticsSummary> = {}

      for (const selectedTenant of selectedTenants) {
        const webhooksData = await fetchWebhooksStatistics(tenant, selectedTenant, token, filters)
        newWebhooksStatisticsData[selectedTenant] = webhooksData

         newWebhooksSummary[selectedTenant] = {
           yesterday: webhooksData?.tenantUsage?.summary?.emittedEventsLastDay || 0,
           thisWeek: webhooksData?.tenantUsage?.summary?.emittedEventsThisWeek || 0,
           thisMonth: webhooksData?.tenantUsage?.summary?.emittedEventsThisMonth || 0,
           thisYear: webhooksData?.tenantUsage?.summary?.emittedEventsThisYear || 0,
           agreedAnnual: webhooksData?.maxAllowedUsage || 0,
         }
      }

      setWebhooksStatisticsData(newWebhooksStatisticsData)
      setWebhooksSummary(newWebhooksSummary)
    } catch (error) {
      console.error('Error fetching Webhooks statistics:', error)
    }
  }

  const fetchDataForTab = async (tabIndex: number, filters: StatisticsFilters) => {
    try {
      switch (tabIndex) {
        case 0:
          await fetchApiCallsData(filters)
          break
        case 1:
          await fetchMakeData(filters)
          break
        case 2:
          await fetchDatabaseData(filters)
          break
        case 3:
          await fetchCloudinaryData(filters)
          break
        case 4:
          await fetchAiData(filters)
          break
        case 5:
          await fetchWebhooksData(filters)
          break
        default:
          console.log(`Tab ${tabIndex} not implemented yet`)
      }
    } catch (error) {
      console.error('Error fetching data for tab:', tabIndex, error)
    }
  }

  return {
    statisticsData,
    makeStatisticsData,
    databaseStatisticsData,
    cloudinaryStatisticsData,
    aiStatisticsData,
    webhooksStatisticsData,
    summary,
    makeSummary,
    databaseSummary,
    cloudinarySummary,
    aiInputSummary,
    aiOutputSummary,
    webhooksSummary,
    fetchDataForTab
  }
} 