import React from 'react'
import { useTranslation } from 'react-i18next'
import { StatisticsSummary, TimeUnit } from '../../models/Statistics.model'
import SharedControls from '../SharedControls'

interface StatisticsTabWrapperProps<T> {
  selectedTenants: string[]
  timeUnit: TimeUnit
  startDate: Date
  endDate: Date
  isLoading: boolean
  onTimeUnitChange: (unit: TimeUnit) => void
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  aggregatedData: { data: T | null; summary: StatisticsSummary } | { data: T | null; inputSummary: StatisticsSummary; outputSummary: StatisticsSummary }
  tenantData: Record<string, T>
  tenantSummaries: Record<string, StatisticsSummary> | { input: Record<string, StatisticsSummary>; output: Record<string, StatisticsSummary> }
  renderTenantView: (data: T | null, summary: any, hideControls: boolean, isLoading: boolean, tenantName: string) => React.ReactNode
}

function StatisticsTabWrapper<T>({
  selectedTenants,
  timeUnit,
  startDate,
  endDate,
  isLoading,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  aggregatedData,
  tenantData,
  tenantSummaries,
  renderTenantView
}: StatisticsTabWrapperProps<T>) {
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

      {selectedTenants.length > 1 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            margin: '0 1rem 1rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              margin: '0 0 1rem 0', 
              color: '#374151'
            }}>
              {t('totalAllSelectedTenants')}
            </h3>
            {renderTenantView(
              aggregatedData.data,
              'inputSummary' in aggregatedData ? aggregatedData.inputSummary : aggregatedData.summary,
              true,
              isLoading,
              'Total (All Selected Tenants)'
            )}
          </div>
        </div>
      )}

      {selectedTenants.map((selectedTenant, index) => (
        <div key={selectedTenant}>
          {selectedTenants.length > 1 && index > 0 && (
            <div style={{ margin: '1.5rem 0', borderTop: '1px solid #e5e7eb' }} />
          )}
          <div style={{ 
            margin: '0 1rem 1rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1rem'
          }}>
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
              'input' in tenantSummaries 
                ? (tenantSummaries as { input: Record<string, StatisticsSummary>; output: Record<string, StatisticsSummary> }).input[selectedTenant] || { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 }
                : (tenantSummaries as Record<string, StatisticsSummary>)[selectedTenant] || { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
              selectedTenants.length > 1,
              isLoading,
              selectedTenant
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatisticsTabWrapper 