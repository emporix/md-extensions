import React, { useState, useEffect } from 'react'
import { TabView, TabPanel } from 'primereact/tabview'
import { useTranslation } from 'react-i18next'
import { useDashboardContext } from './context/Dashboard.context'
import { StatisticsFilters, TimeUnit } from './models/Statistics.model'
import { useStatisticsData } from './hooks/useStatisticsData'
import { createCsvDownloadHandlers } from './utils/csvDownloaders'
import TenantSelector from './components/TenantSelector'
import MultiTenantStatisticsTab from './components/MultiTenantStatisticsTab'
import AiStatisticsTab from './components/tabs/AiStatisticsTab'
import ApiCallsView from './views/ApiCallsView'
import MakeView from './views/MakeView'
import DatabaseView from './views/DatabaseView'
import CloudinaryView from './views/CloudinaryView'
import WebhooksView from './views/WebhooksView'

const Statistics: React.FC = () => {
  const { t } = useTranslation()
  const { token, tenant } = useDashboardContext()
  const [selectedTenants, setSelectedTenants] = useState<string[]>([tenant])
  const [isLoading, setIsLoading] = useState(false)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('day')
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    return sevenDaysAgo
  })
  const [endDate, setEndDate] = useState<Date>(() => new Date())
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]))

  const statisticsData = useStatisticsData(tenant, token, selectedTenants)

  const csvHandlers = createCsvDownloadHandlers(
    selectedTenants,
    statisticsData.statisticsData,
    statisticsData.makeStatisticsData,
    statisticsData.databaseStatisticsData,
    statisticsData.cloudinaryStatisticsData,
    statisticsData.aiStatisticsData,
    statisticsData.webhooksStatisticsData,
    statisticsData.summary,
    statisticsData.makeSummary,
    statisticsData.databaseSummary,
    statisticsData.cloudinarySummary,
    statisticsData.aiInputSummary,
    statisticsData.aiOutputSummary,
    statisticsData.webhooksSummary
  )

  const handleTabChange = (e: { index: number }) => {
    const newTabIndex = e.index
    setActiveTabIndex(newTabIndex)
    
    if (!loadedTabs.has(newTabIndex)) {
      setLoadedTabs(prev => new Set([...prev, newTabIndex]))
      fetchDataForTab(newTabIndex)
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
      await statisticsData.fetchDataForTab(tabIndex, filters)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setSelectedTenants([tenant])
  }, [tenant])

  useEffect(() => {
    if (loadedTabs.has(activeTabIndex)) {
      fetchDataForTab(activeTabIndex)
    }
  }, [timeUnit, startDate, endDate, selectedTenants, token])

  useEffect(() => {
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
    setLoadedTabs(new Set([activeTabIndex]))
  }

  const createViewRenderer = (ViewComponent: any, downloadHandler: (tenantName: string) => void) => 
    (data: any, summary: any, hideControls: boolean, isLoadingParam: boolean) => {
      const tenantName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : data?.tenant || 'Unknown'
      const isTotal = tenantName === 'Total (All Selected Tenants)'
      return (
        <ViewComponent
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
          onDownloadCSV={() => downloadHandler(tenantName)}
          tenantName={tenantName}
          {...(isTotal ? { selectedTenants } : {})}
        />
      )
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
                tenantData={statisticsData.statisticsData}
                tenantSummaries={statisticsData.summary}
                getAggregatedData={csvHandlers.getAggregatedApiCallsData}
                renderTenantView={createViewRenderer(ApiCallsView, csvHandlers.handleDownloadApiCallsCSV)}
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
                tenantData={statisticsData.makeStatisticsData}
                tenantSummaries={statisticsData.makeSummary}
                getAggregatedData={csvHandlers.getAggregatedMakeData}
                renderTenantView={createViewRenderer(MakeView, csvHandlers.handleDownloadMakeCSV)}
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
                tenantData={statisticsData.databaseStatisticsData}
                tenantSummaries={statisticsData.databaseSummary}
                getAggregatedData={csvHandlers.getAggregatedDatabaseData}
                renderTenantView={createViewRenderer(DatabaseView, csvHandlers.handleDownloadDatabaseCSV)}
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
                tenantData={statisticsData.cloudinaryStatisticsData}
                tenantSummaries={statisticsData.cloudinarySummary}
                getAggregatedData={csvHandlers.getAggregatedCloudinaryData}
                renderTenantView={createViewRenderer(CloudinaryView, csvHandlers.handleDownloadCloudinaryCSV)}
              />
            )}
          </TabPanel>
          <TabPanel header={t('ai')}>
            {activeTabIndex === 4 && (
              <AiStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                aggregatedData={csvHandlers.getAggregatedAiData()}
                aiStatisticsData={statisticsData.aiStatisticsData}
                aiInputSummary={statisticsData.aiInputSummary}
                aiOutputSummary={statisticsData.aiOutputSummary}
                onDownloadCSV={csvHandlers.handleDownloadAiCSV}
              />
            )}
          </TabPanel>
          <TabPanel header={t('webhooks')}>
            {activeTabIndex === 5 && (
              <MultiTenantStatisticsTab
                selectedTenants={selectedTenants}
                timeUnit={timeUnit}
                startDate={startDate}
                endDate={endDate}
                isLoading={isLoading}
                onTimeUnitChange={handleTimeUnitChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                tenantData={statisticsData.webhooksStatisticsData}
                tenantSummaries={statisticsData.webhooksSummary}
                getAggregatedData={csvHandlers.getAggregatedWebhooksData}
                renderTenantView={createViewRenderer(WebhooksView, csvHandlers.handleDownloadWebhooksCSV)}
              />
            )}
          </TabPanel>
        </TabView>
      </div>
    </div>
  )
}

export default Statistics 