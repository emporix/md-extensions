import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import SummaryCards from '../components/SummaryCards'
import StatisticsChart from '../components/StatisticsChart'
import TimeUnitSelector from '../components/TimeUnitSelector'
import DateRangePicker from '../components/DateRangePicker'
import { AiStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'

interface AiViewProps {
  data: AiStatisticsResponse | null
  inputSummary: StatisticsSummary
  outputSummary: StatisticsSummary
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

const AiView: React.FC<AiViewProps> = ({
  data,
  inputSummary,
  outputSummary,
  timeUnit,
  startDate,
  endDate,
  isLoading,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  hideControls = false,
  onDownloadCSV,
}) => {
  const { t } = useTranslation()

  const inputChartLegends = {
    agreement: t('agreedAnnualInputTokensLegend'),
    withinPeriod: t('inputTokensWithinPeriod'),
    total: t('totalInputTokens'),
  }

  const outputChartLegends = {
    agreement: t('agreedAnnualOutputTokensLegend'),
    withinPeriod: t('outputTokensWithinPeriod'),
    total: t('totalOutputTokens'),
  }

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 1rem 0.5rem 1rem', color: '#374151' }}>
          {t('inputTokens')}
        </h3>
        <SummaryCards summary={inputSummary} agreementLabel={t('agreedAnnualInputTokens')} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 1rem 0.5rem 1rem', color: '#374151' }}>
          {t('outputTokens')}
        </h3>
        <SummaryCards summary={outputSummary} agreementLabel={t('agreedAnnualOutputTokens')} />
      </div>

      <div className="chart-container" style={{ margin: '0 1rem 2rem 1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#374151' }}>
          {t('inputTokens')} - Chart
        </h3>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 1rem 0' }}>
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
          summary={inputSummary}
          timeUnit={timeUnit}
          chartLegends={inputChartLegends}
          isLoading={isLoading}
          chartType="input"
        />
      </div>

      <div className="chart-container" style={{ margin: '0 1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#374151' }}>
          {t('outputTokens')} - Chart
        </h3>
        <StatisticsChart
          data={data}
          summary={outputSummary}
          timeUnit={timeUnit}
          chartLegends={outputChartLegends}
          isLoading={isLoading}
          chartType="output"
        />
      </div>
    </>
  )
}

export default AiView 