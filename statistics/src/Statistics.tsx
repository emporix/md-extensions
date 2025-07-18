import React, { useState, useEffect } from 'react'
import { TabView, TabPanel } from 'primereact/tabview'
import { useTranslation } from 'react-i18next'
import { useDashboardContext } from './context/Dashboard.context'
import { fetchStatistics, fetchMakeStatistics } from './api'
import { ApiCallsStatisticsResponse, MakeStatisticsResponse, StatisticsFilters, StatisticsSummary, TimeUnit } from './models/Statistics.model'
import ApiCallsView from './views/ApiCallsView'
import MakeView from './views/MakeView'
import AiView from './views/AiView'
import DatabaseView from './views/DatabaseView'
import CloudinaryView from './views/CloudinaryView'
import WebhooksView from './views/WebhooksView'
import TenantSelector from './components/TenantSelector'
import SharedControls from './components/SharedControls'
import MultiTenantStatisticsTab from './components/MultiTenantStatisticsTab'
import { aggregateApiCallsData, aggregateMakeData } from './utils/aggregationUtils'
import { 
  downloadCSV, 
  convertApiCallsToCSV, 
  convertMakeToCSV,
  convertMultiTenantApiCallsToCSV,
  convertMultiTenantMakeToCSV 
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
  const [summary, setSummary] = useState<Record<string, StatisticsSummary>>({})
  const [makeSummary, setMakeSummary] = useState<Record<string, StatisticsSummary>>({})
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

  // Generic render function that works for both aggregated and individual views
  const renderApiCallsView = (data: ApiCallsStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createApiCallsRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
  }

  const renderMakeView = (data: MakeStatisticsResponse | null, summary: StatisticsSummary, hideControls: boolean, isLoadingParam: boolean) => {
    const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
    return createMakeRenderer(tenantName)(data, summary, hideControls, isLoadingParam)
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
          <TabPanel header={t('ai')}>
            {activeTabIndex === 2 && (
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
          <TabPanel header={t('database')}>
            {activeTabIndex === 3 && (
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
                <DatabaseView />
              </div>
            )}
          </TabPanel>
          <TabPanel header={t('cloudinary')}>
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
                <CloudinaryView />
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