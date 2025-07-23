import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import SummaryCards from '../components/SummaryCards'
import StatisticsChart from '../components/StatisticsChart'
import TimeUnitSelector from '../components/TimeUnitSelector'
import DateRangePicker from '../components/DateRangePicker'
import { WebhooksStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'

interface WebhooksViewProps {
  data: WebhooksStatisticsResponse | null
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

const WebhooksView: React.FC<WebhooksViewProps> = ({
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
}) => {
  const { t } = useTranslation()

  const chartLegends = {
    agreement: t('agreedAnnualWebhooksLegend'),
    withinPeriod: t('webhooksWithinPeriod'),
    total: t('totalWebhooks'),
  }

  return (
    <>
      <SummaryCards summary={summary} agreementLabel={t('agreedAnnualWebhooks')} />

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
      </div>
    </>
  )
}

export default WebhooksView 