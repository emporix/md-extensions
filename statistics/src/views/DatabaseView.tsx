import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import SummaryCards from '../components/SummaryCards'
import StatisticsChart from '../components/StatisticsChart'
import TimeUnitSelector from '../components/TimeUnitSelector'
import DateRangePicker from '../components/DateRangePicker'
import { DatabaseStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'

interface DatabaseViewProps {
  data: DatabaseStatisticsResponse | null
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

const DatabaseView: React.FC<DatabaseViewProps> = ({
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

  const convertBytesToGB = (bytes: number): number => {
    return bytes / (1024 * 1024 * 1024)
  }

  const gbSummary: StatisticsSummary = {
    yesterday: convertBytesToGB(summary.yesterday),
    thisWeek: convertBytesToGB(summary.thisWeek),
    thisMonth: convertBytesToGB(summary.thisMonth),
    thisYear: convertBytesToGB(summary.thisYear),
    agreedAnnual: convertBytesToGB(summary.agreedAnnual),
  }

  const convertedData: DatabaseStatisticsResponse | null = data ? {
    ...data,
    tenantUsage: {
      ...data.tenantUsage,
      summary: {
        totalBytesLastDay: convertBytesToGB(data.tenantUsage.summary.totalBytesLastDay),
        totalBytesThisWeek: convertBytesToGB(data.tenantUsage.summary.totalBytesThisWeek),
        totalBytesThisMonth: convertBytesToGB(data.tenantUsage.summary.totalBytesThisMonth),
        totalBytesThisYear: convertBytesToGB(data.tenantUsage.summary.totalBytesThisYear),
      },
      range: {
        ...data.tenantUsage.range,
        values: data.tenantUsage.range.values.map(item => ({
          ...item,
          totalBytes: convertBytesToGB(item.totalBytes),
        })),
      },
    },
  } : null

  const chartLegends = {
    agreement: t('agreedAnnualDatabaseUsageLegend'),
    withinPeriod: t('databaseUsageWithinPeriod'),
    total: t('totalDatabaseUsage'),
  }

  return (
    <>
      <SummaryCards summary={gbSummary} agreementLabel={t('agreedAnnualDatabaseUsage')} unit="GB" />

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
          data={convertedData}
          summary={gbSummary}
          timeUnit={timeUnit}
          chartLegends={chartLegends}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}

export default DatabaseView 