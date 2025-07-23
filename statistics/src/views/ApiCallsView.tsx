import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import SummaryCards from '../components/SummaryCards'
import StatisticsChart from '../components/StatisticsChart'
import ApiProxyChart from '../components/ApiProxyChart'
import TimeUnitSelector from '../components/TimeUnitSelector'
import DateRangePicker from '../components/DateRangePicker'
import { ApiCallsStatisticsResponse, ApiCallsExpandedStatisticsResponse, StatisticsSummary, TimeUnit, StatisticsFilters } from '../models/Statistics.model'
import { fetchExpandedApiCallsStatistics } from '../api'
import { useDashboardContext } from '../context/Dashboard.context'

interface ApiCallsViewProps {
  data: ApiCallsStatisticsResponse | null
  summary: StatisticsSummary
  timeUnit: TimeUnit
  startDate: Date
  endDate: Date
  isLoading: boolean
  onTimeUnitChange: (unit: TimeUnit) => void
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  hideControls?: boolean
  onDownloadCSV?: () => void
  tenantName?: string
}

const ApiCallsView: React.FC<ApiCallsViewProps> = ({
  data,
  summary,
  timeUnit,
  startDate,
  endDate,
  isLoading,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  hideControls = false,
  onDownloadCSV,
  tenantName
}) => {
  const { t } = useTranslation()
  const { token, tenant } = useDashboardContext()
  const [showAdvancedData, setShowAdvancedData] = useState(false)
  const [expandedData, setExpandedData] = useState<ApiCallsExpandedStatisticsResponse | null>(null)
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false)

  const chartLegends = {
    agreement: t('agreedAnnualApiCallsLegend'),
    withinPeriod: t('apiCallsWithinPeriod'),
    total: t('totalApiCalls'),
  }

  const handleToggleAdvancedData = async () => {
    if (!showAdvancedData && !expandedData) {
      setIsLoadingExpanded(true)
      try {
        const filters: StatisticsFilters = {
          timeUnit,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }
        
        const actualTenantName = tenantName === 'Total (All Selected Tenants)' ? tenant : (tenantName || tenant)
        const result = await fetchExpandedApiCallsStatistics(tenant, actualTenantName, token, filters)
        setExpandedData(result)
      } catch (error) {
        console.error('Error fetching expanded API calls data:', error)
      } finally {
        setIsLoadingExpanded(false)
      }
    }
    setShowAdvancedData(!showAdvancedData)
  }

  return (
    <>
      <SummaryCards summary={summary} agreementLabel={t('agreedAnnualApiCalls')} />

      <div className="chart-container" style={{ margin: '0 1rem' }}>
        {!hideControls && (
          <div className="chart-controls">
            <TimeUnitSelector timeUnit={timeUnit} onTimeUnitChange={onTimeUnitChange} />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
            />
            {onDownloadCSV && (
              <Button
                label={t('downloadCSV')}
                icon="pi pi-download"
                onClick={onDownloadCSV}
                className="p-button-sm"
                style={{ marginLeft: '0.5rem' }}
              />
            )}
          </div>
        )}
        {hideControls && onDownloadCSV && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 1rem 1rem 0' }}>
            <Button
              label={t('downloadCSV')}
              icon="pi pi-download"
              onClick={onDownloadCSV}
              className="p-button-sm"
            />
          </div>
        )}

        <StatisticsChart
          data={data}
          summary={summary}
          timeUnit={timeUnit}
          chartLegends={chartLegends}
          isLoading={isLoading}
        />

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Button
            label={showAdvancedData ? t('hideAdvancedData') : t('showAdvancedData')}
            icon={showAdvancedData ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
            onClick={handleToggleAdvancedData}
            className="p-button-text p-button-sm"
            style={{ fontSize: '0.875rem' }}
          />
        </div>

        {/* Loading indicator for advanced data */}
        {isLoadingExpanded && (
          <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', marginRight: '0.5rem' }} />
            <span>{t('loadingAdvancedData') || 'Loading advanced data...'}</span>
          </div>
        )}

        {showAdvancedData && !isLoadingExpanded && (
          <Panel 
            header={t('apiProxyBreakdown')} 
            toggleable={false}
            style={{ marginTop: '1rem' }}
          >
            <ApiProxyChart
              data={expandedData}
              timeUnit={timeUnit}
              isLoading={isLoadingExpanded}
            />
          </Panel>
        )}
      </div>
    </>
  )
}

export default ApiCallsView 