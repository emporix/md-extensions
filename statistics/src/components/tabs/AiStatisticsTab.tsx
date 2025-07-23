import React from 'react'
import { useTranslation } from 'react-i18next'
import { AiStatisticsResponse, StatisticsSummary, TimeUnit } from '../../models/Statistics.model'
import AiView from '../../views/AiView'
import SharedControls from '../SharedControls'

interface AiStatisticsTabProps {
  selectedTenants: string[]
  timeUnit: TimeUnit
  startDate: Date
  endDate: Date
  isLoading: boolean
  onTimeUnitChange: (unit: TimeUnit) => void
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  aggregatedData: { data: AiStatisticsResponse | null; inputSummary: StatisticsSummary; outputSummary: StatisticsSummary }
  aiStatisticsData: Record<string, AiStatisticsResponse>
  aiInputSummary: Record<string, StatisticsSummary>
  aiOutputSummary: Record<string, StatisticsSummary>
  onDownloadCSV: (tenantName: string) => void
}

const AiStatisticsTab: React.FC<AiStatisticsTabProps> = ({
  selectedTenants,
  timeUnit,
  startDate,
  endDate,
  isLoading,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  aggregatedData,
  aiStatisticsData,
  aiInputSummary,
  aiOutputSummary,
  onDownloadCSV
}) => {
  const { t } = useTranslation()

  const createAiRenderer = (tenantName: string) => (
    data: AiStatisticsResponse | null, 
    inputSummary: StatisticsSummary,
    outputSummary: StatisticsSummary,
    hideControls: boolean, 
    isLoadingParam: boolean
  ) => {
    const displayName = data?.tenant === 'aggregated' ? 'Total (All Selected Tenants)' : tenantName
    
    return (
      <AiView
        data={data}
        inputSummary={inputSummary}
        outputSummary={outputSummary}
        timeUnit={timeUnit}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoadingParam}
        onTimeUnitChange={onTimeUnitChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        hideControls={hideControls}
        onDownloadCSV={() => onDownloadCSV(displayName)}
        tenantName={displayName}
      />
    )
  }

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
            {createAiRenderer('Total (All Selected Tenants)')(
              aggregatedData.data, 
              aggregatedData.inputSummary, 
              aggregatedData.outputSummary, 
              true, 
              isLoading
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
            {createAiRenderer(selectedTenant)(
              aiStatisticsData[selectedTenant] || null,
              aiInputSummary[selectedTenant] || { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
              aiOutputSummary[selectedTenant] || { yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, agreedAnnual: 0 },
              selectedTenants.length > 1,
              isLoading
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AiStatisticsTab 