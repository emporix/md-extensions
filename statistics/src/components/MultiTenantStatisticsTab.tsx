import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import SharedControls from './SharedControls'
import { ApiCallsStatisticsResponse, MakeStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'

interface MultiTenantStatisticsTabProps<T> {
  selectedTenants: string[]
  timeUnit: TimeUnit
  startDate: Date
  endDate: Date
  isLoading: boolean
  onTimeUnitChange: (unit: TimeUnit) => void
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  // Data and summary for each tenant
  tenantData: Record<string, T>
  tenantSummaries: Record<string, StatisticsSummary>
  // Aggregation function
  getAggregatedData: () => { data: T | null; summary: StatisticsSummary }
  // Render function for individual tenant views
  renderTenantView: (data: T | null, summary: StatisticsSummary, hideControls: boolean, isLoading: boolean) => React.ReactNode
}

function MultiTenantStatisticsTab<T extends ApiCallsStatisticsResponse | MakeStatisticsResponse>({
  selectedTenants,
  timeUnit,
  startDate,
  endDate,
  isLoading,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  tenantData,
  tenantSummaries,
  getAggregatedData,
  renderTenantView,
}: MultiTenantStatisticsTabProps<T>) {
  const { t } = useTranslation()

  return (
    <div>
      {selectedTenants.length > 1 && (
        <div style={{ margin: '0 1rem 1rem 1rem' }}>
          <SharedControls
            timeUnit={timeUnit}
            startDate={startDate}
            endDate={endDate}
            onTimeUnitChange={onTimeUnitChange}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </div>
      )}
      
      {selectedTenants.length > 1 && (() => {
        const aggregatedData = getAggregatedData()
        return (
          <div style={{ marginBottom: '2rem' }}>
            <Card 
              style={{ 
                margin: '0 1rem 1rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ padding: '0.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  margin: '0 0 1rem 0', 
                  color: '#374151'
                }}>
                  {t('totalAllSelectedTenants')}
                </h3>
                {renderTenantView(aggregatedData.data, aggregatedData.summary, true, isLoading)}
              </div>
            </Card>
          </div>
        )
      })()}
      
      {selectedTenants.map((selectedTenant, index) => (
        <div key={selectedTenant}>
          {selectedTenants.length > 1 && index > 0 && (
            <Divider style={{ margin: '1.5rem 0' }} />
          )}
          <Card 
            style={{ 
              margin: '0 1rem 1rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ padding: '0.5rem' }}>
              {selectedTenants.length > 1 && (
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  margin: '0 0 1rem 0', 
                  color: '#374151'
                }}>
                  {selectedTenant}
                </h3>
              )}
              {renderTenantView(
                tenantData[selectedTenant] || null,
                tenantSummaries[selectedTenant] || { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
                selectedTenants.length > 1,
                isLoading
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

export default MultiTenantStatisticsTab 