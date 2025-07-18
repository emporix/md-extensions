import React, { useState, useEffect } from 'react'
import { TabView, TabPanel } from 'primereact/tabview'
import { useTranslation } from 'react-i18next'
import { useDashboardContext } from './context/Dashboard.context'
import { fetchStatistics, fetchMakeStatistics, fetchDatabaseStatistics, fetchCloudinaryStatistics } from './api'
import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, StatisticsFilters, StatisticsSummary, TimeUnit } from './models/Statistics.model'
import ApiCallsView from './views/ApiCallsView'
import MakeView from './views/MakeView'
import AiView from './views/AiView'
import DatabaseView from './views/DatabaseView'
import CloudinaryView from './views/CloudinaryView'
import WebhooksView from './views/WebhooksView'
import TenantSelector from './components/TenantSelector'
import SharedControls from './components/SharedControls'
import MultiTenantStatisticsTab from './components/MultiTenantStatisticsTab'
import { aggregateApiCallsData, aggregateMakeData, aggregateDatabaseData, aggregateCloudinaryData } from './utils/aggregationUtils'
import { 
  downloadCSV, 
  convertApiCallsToCSV, 
  convertMakeToCSV,
  convertDatabaseToCSV,
  convertCloudinaryToCSV,
  convertMultiTenantApiCallsToCSV,
  convertMultiTenantMakeToCSV,
  convertMultiTenantDatabaseToCSV,
  convertMultiTenantCloudinaryToCSV 
} from './utils/csvUtils'

const Statistics: React.FC = () => {
  const { t } = useTranslation()
  const { token, tenant } = useDashboardContext()
  const [selectedTenants, setSelectedTenants] = useState<string[]>([tenant])
  const [isLoading, setIsLoading] = useState(false)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('day')
  const [startDate, setStartDate] = useState<Date>(new Date('2025-07-09'))
  const [endDate, setEndDate] = useState<Date>(new Date('2025-07-16'))
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [statisticsData, setStatisticsData] = useState<Record<string, ApiCallsStatisticsResponse>>({})
  const [makeStatisticsData, setMakeStatisticsData] = useState<Record<string, MakeStatisticsResponse>>({})
  const [databaseStatisticsData, setDatabaseStatisticsData] = useState<Record<string, DatabaseStatisticsResponse>>({})
  const [cloudinaryStatisticsData, setCloudinaryStatisticsData] = useState<Record<string, CloudinaryStatisticsResponse>>({})
  const [summary, setSummary] = useState<Record<string, StatisticsSummary>>({})
  const [makeSummary, setMakeSummary] = useState<Record<string, StatisticsSummary>>({})
  const [databaseSummary, setDatabaseSummary] = useState<Record<string, StatisticsSummary>>({})
  const [cloudinarySummary, setCloudinarySummary] = useState<Record<string, StatisticsSummary>>({})
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]))

  const fetchApiCallsData = async (filters: StatisticsFilters) => {
    try {
      const newStatisticsData: Record<string, ApiCallsStatisticsResponse> = {}
      const newSummary: Record<string, StatisticsSummary> = {}
      
      for (const selectedTenant of selectedTenants) {
        const apiData = await fetchStatistics(tenant, selectedTenant, token, filters)
        newStatisticsData[selectedTenant] = apiData
        
        // Update summary with actual API data
        newSummary[selectedTenant] = {
          yesterday: apiData?.tenantUsage?.summary?.lastDay || 0,
          thisWeek: apiData?.tenantUsage?.summary?.thisWeek || 0,
          thisMonth: apiData?.tenantUsage?.summary?.thisMonth || 0,
          thisYear: apiData?.tenantUsage?.summary?.thisYear || 0,
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
        
        // Update Make summary with actual data - Make uses different field names
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

                 // Update Database summary with actual data
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

                 // Update Cloudinary summary with actual data
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

  const fetchDataForTab = async (tabIndex: number) => {
    setIsLoading(true)
    
    const filters: StatisticsFilters = {
      timeUnit,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    }

    try {
      switch (tabIndex) {
        case 0: // API Calls
          await fetchApiCallsData(filters)
          break
        case 1: // Make
          await fetchMakeData(filters)
          break
        case 2: // Database
          await fetchDatabaseData(filters)
          break
        case 3: // Cloudinary
          await fetchCloudinaryData(filters)
          break
        // Add more cases for other tabs when implemented
        default:
          console.log(`Tab ${tabIndex} not implemented yet`)
      }
    } catch (error) {
      console.error('Error fetching data for tab:', tabIndex, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (e: { index: number }) => {
    const newTabIndex = e.index
    setActiveTabIndex(newTabIndex)
    
    // Only fetch data if this tab hasn't been loaded before
    if (!loadedTabs.has(newTabIndex)) {
      setLoadedTabs(prev => new Set([...prev, newTabIndex]))
      fetchDataForTab(newTabIndex)
    }
  }

  useEffect(() => {
    // Update selected tenant when context tenant changes
    setSelectedTenants([tenant])
  }, [tenant])

  useEffect(() => {
    // Only fetch data for the currently active tab when filters change
    if (loadedTabs.has(activeTabIndex)) {
      fetchDataForTab(activeTabIndex)
    }
  }, [timeUnit, startDate, endDate, selectedTenants, token])

  useEffect(() => {
    // Fetch data for the initial tab (API Calls) on component mount
    fetchDataForTab(0)
  }, [selectedTenants, token])

  const handleTimeUnitChange = (unit: TimeUnit) => {
    setTimeUnit(unit)
  }

  const handleStartDateChange = (date: Date) => {
    setStartDate(date)
  }

  const handleEndDateChange = (date: Date) => {
    setEndDate(date)
  }

  const handleTenantChange = (newTenants: string[]) => {
    setSelectedTenants(newTenants)
    // Reset loaded tabs when tenant changes so data is refetched
    setLoadedTabs(new Set([activeTabIndex]))
  }

  // Helper function to aggregate API calls data across all selected tenants
  const getAggregatedApiCallsData = () => {
    return aggregateApiCallsData(selectedTenants, statisticsData, summary)
  }

  // Helper function to aggregate Make data across all selected tenants
  const getAggregatedMakeData = () => {
    return aggregateMakeData(selectedTenants, makeStatisticsData, makeSummary)
  }

  // Helper function to aggregate Database data across all selected tenants
  const getAggregatedDatabaseData = () => {
    return aggregateDatabaseData(selectedTenants, databaseStatisticsData, databaseSummary)
  }

  // Helper function to aggregate Cloudinary data across all selected tenants
  const getAggregatedCloudinaryData = () => {
    return aggregateCloudinaryData(selectedTenants, cloudinaryStatisticsData, cloudinarySummary)
  }

  // CSV Download handlers
  const handleDownloadApiCallsCSV = (tenantName: string = 'Unknown') => {
    const tenantData = tenantName === 'Total (All Selected Tenants)' 
      ? getAggregatedApiCallsData().data
      : statisticsData[tenantName]
    
    if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
      // Download multi-tenant CSV
      const csvContent = convertMultiTenantApiCallsToCSV(statisticsData, selectedTenants)
      const filename = `api-calls-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      // Download single tenant CSV
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
      // Download multi-tenant CSV
      const csvContent = convertMultiTenantMakeToCSV(makeStatisticsData, selectedTenants)
      const filename = `make-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      // Download single tenant CSV
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
      // Download multi-tenant CSV
      const csvContent = convertMultiTenantDatabaseToCSV(databaseStatisticsData, selectedTenants)
      const filename = `database-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      // Download single tenant CSV
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
      // Download multi-tenant CSV
      const csvContent = convertMultiTenantCloudinaryToCSV(cloudinaryStatisticsData, selectedTenants)
      const filename = `cloudinary-statistics-all-tenants-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    } else {
      // Download single tenant CSV
      const csvContent = convertCloudinaryToCSV(tenantData, tenantName)
      const filename = `cloudinary-statistics-${tenantName}-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    }
  }

  // Create wrapper functions for individual tenant rendering
  const createApiCallsRenderer = (tenantName: string) => (
    data: ApiCallsStatisticsResponse | null, 
    summary: StatisticsSummary, 
    hideControls: boolean, 
    isLoadingParam: boolean
  ) => {
    const displayName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : tenantName
    
    return (
      <ApiCallsView
        data={data}
        summary={summary}
        timeUnit={timeUnit}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoadingParam}
        onTimeUnitChange={handleTimeUnitChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        hideControls={hideControls}
        onDownloadCSV={() => handleDownloadApiCallsCSV(displayName)}
        tenantName={displayName}
      />
    )
  }

  const createMakeRenderer = (tenantName: string) => (
    data: MakeStatisticsResponse | null, 
    summary: StatisticsSummary, 
    hideControls: boolean, 
    isLoadingParam: boolean
  ) => {
    const displayName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : tenantName
    
    return (
      <MakeView
        data={data}
        summary={summary}
        timeUnit={timeUnit}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoadingParam}
        onTimeUnitChange={handleTimeUnitChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        hideControls={hideControls}
        onDownloadCSV={() => handleDownloadMakeCSV(displayName)}
        tenantName={displayName}
      />
    )
  }

  const createDatabaseRenderer = (tenantName: string) => (
    data: DatabaseStatisticsResponse | null, 
    summary: StatisticsSummary, 
    hideControls: boolean, 
    isLoadingParam: boolean
  ) => {
    const displayName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : tenantName
    
    return (
      <DatabaseView
        data={data}
        summary={summary}
        timeUnit={timeUnit}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoadingParam}
        onTimeUnitChange={handleTimeUnitChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        hideControls={hideControls}
        onDownloadCSV={() => handleDownloadDatabaseCSV(displayName)}
        tenantName={displayName}
      />
    )
  }

  const createCloudinaryRenderer = (tenantName: string) => (
    data: CloudinaryStatisticsResponse | null, 
    summary: StatisticsSummary, 
    hideControls: boolean, 
    isLoadingParam: boolean
  ) => {
    const displayName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : tenantName
    
    return (
      <CloudinaryView
        data={data}
        summary={summary}
        timeUnit={timeUnit}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoadingParam}
        onTimeUnitChange={handleTimeUnitChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        hideControls={hideControls}
        onDownloadCSV={() => handleDownloadCloudinaryCSV(displayName)}
        tenantName={displayName}
      />
    )
  }

  // Generic render function that works for both aggregated and individual views
  const renderApiCallsView = (data: ApiCallsStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createApiCallsRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
  }

  const renderMakeView = (data: MakeStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createMakeRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
  }

  const renderDatabaseView = (data: DatabaseStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createDatabaseRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
  }

  const renderCloudinaryView = (data: CloudinaryStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createCloudinaryRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 0.5rem 0' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>{t('statistics')}</h1>
          <TenantSelector 
            currentTenant={tenant}
            token={token}
            onTenantChange={handleTenantChange}
          />
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>
        <TabView activeIndex={activeTabIndex} onTabChange={handleTabChange}>
          <TabPanel header={t('apiCalls')}>
            {activeTabIndex === 0 && (
              <MultiTenantStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                tenantData={statisticsData}
                tenantSummaries={summary}
                getAggregatedData={getAggregatedApiCallsData}
                renderTenantView={renderApiCallsView}
              />
            )}
          </TabPanel>
          <TabPanel header={t('make')}>
            {activeTabIndex === 1 && (
              <MultiTenantStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                tenantData={makeStatisticsData}
                tenantSummaries={makeSummary}
                getAggregatedData={getAggregatedMakeData}
                renderTenantView={renderMakeView}
              />
            )}
          </TabPanel>
          <TabPanel header={t('database')}>
            {activeTabIndex === 2 && (
              <MultiTenantStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                tenantData={databaseStatisticsData}
                tenantSummaries={databaseSummary}
                getAggregatedData={getAggregatedDatabaseData}
                renderTenantView={renderDatabaseView}
              />
            )}
          </TabPanel>
          <TabPanel header={t('cloudinary')}>
            {activeTabIndex === 3 && (
              <MultiTenantStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                tenantData={cloudinaryStatisticsData}
                tenantSummaries={cloudinarySummary}
                getAggregatedData={getAggregatedCloudinaryData}
                renderTenantView={renderCloudinaryView}
              />
            )}
          </TabPanel>
          <TabPanel header={t('ai')}>
            {activeTabIndex === 4 && (
              <div>
                {selectedTenants.length > 1 && (
                  <div style={{ margin: '0 1rem 1rem 1rem' }}>
                    <SharedControls
                      timeUnit={timeUnit}
                      startDate={startDate}
                      endDate={endDate}
                      onTimeUnitChange={handleTimeUnitChange}
                      onStartDateChange={handleStartDateChange}
                      onEndDateChange={handleEndDateChange}
                    />
                  </div>
                )}
                <AiView />
              </div>
            )}
          </TabPanel>
          <TabPanel header={t('webhooks')}>
            {activeTabIndex === 5 && (
              <div>
                {selectedTenants.length > 1 && (
                  <div style={{ margin: '0 1rem 1rem 1rem' }}>
                    <SharedControls
                      timeUnit={timeUnit}
                      startDate={startDate}
                      endDate={endDate}
                      onTimeUnitChange={handleTimeUnitChange}
                      onStartDateChange={handleStartDateChange}
                      onEndDateChange={handleEndDateChange}
                    />
                  </div>
                )}
                <WebhooksView />
              </div>
            )}
          </TabPanel>
        </TabView>
      </div>
    </div>
  )
}

export default Statistics 