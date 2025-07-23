import React, { useState, useEffect } from 'react'
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
  selectedTenants?: string[]
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
  tenantName,
  selectedTenants = [],
}) => {
  const { t } = useTranslation()
  const { token, tenant } = useDashboardContext()
  const [showAdvancedData, setShowAdvancedData] = useState(false)
  const [expandedData, setExpandedData] = useState<ApiCallsExpandedStatisticsResponse | null>(null)
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false)

  // Reset advanced data and collapse panel on filter change
  useEffect(() => {
    setShowAdvancedData(false)
    setExpandedData(null)
    setIsLoadingExpanded(false)
  }, [timeUnit, startDate, endDate])

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
        if (tenantName === 'Total (All Selected Tenants)' && selectedTenants.length > 1) {
          // Multi-tenant: fetch all, sum by date/proxy
          const promises = selectedTenants.map((t: string) =>
            fetchExpandedApiCallsStatistics(tenant, t, token, filters)
          )
          const results: ApiCallsExpandedStatisticsResponse[] = await Promise.all(promises)
          // Aggregate by date and proxy
          const proxyAgg: Record<string, Record<string, number>> = {}
          results.forEach((res: ApiCallsExpandedStatisticsResponse) => {
            res.tenantUsage.range.values.forEach((item: any) => {
              if (!proxyAgg[item.date]) proxyAgg[item.date] = {}
              const proxy = item.apiproxy || 'unknown'
              proxyAgg[item.date][proxy] = (proxyAgg[item.date][proxy] || 0) + (item.requestsCount || 0)
            })
          })
          // Flatten to values array
          const allDates = Object.keys(proxyAgg)
          const values: any[] = []
          allDates.forEach(date => {
            Object.entries(proxyAgg[date]).forEach(([apiproxy, requestsCount]) => {
              values.push({ date, apiproxy, requestsCount })
            })
          })
          setExpandedData({
            tenant: 'aggregated',
            maxAllowedUsage: 0,
            tenantUsage: {
              summary: { requestsCountLastDay: 0, requestsCountThisWeek: 0, requestsCountThisMonth: 0, requestsCountThisYear: 0 },
              range: {
                period: timeUnit,
                startTime: startDate.toISOString().slice(0, 10),
                endTime: endDate.toISOString().slice(0, 10),
                values,
              },
            },
          })
        } else {
          // Single tenant
          const actualTenantName = tenantName === 'Total (All Selected Tenants)' ? tenant : (tenantName || tenant)
          const result = await fetchExpandedApiCallsStatistics(tenant, actualTenantName, token, filters)
          setExpandedData(result)
        }
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