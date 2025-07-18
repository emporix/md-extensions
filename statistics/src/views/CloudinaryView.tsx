import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import SummaryCards from '../components/SummaryCards'
import StatisticsChart from '../components/StatisticsChart'
import TimeUnitSelector from '../components/TimeUnitSelector'
import DateRangePicker from '../components/DateRangePicker'
import { CloudinaryStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'

interface CloudinaryViewProps {
  data: CloudinaryStatisticsResponse | null
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

const CloudinaryView: React.FC<CloudinaryViewProps> = ({
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

  // Convert summary values from bytes to GB for display
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

  // Convert chart data from bytes to GB
  const convertedData: CloudinaryStatisticsResponse | null = data ? {
    ...data,
    tenantUsage: {
      ...data.tenantUsage,
      summary: {
        ...data.tenantUsage.summary,
        storageBytesLastDay: convertBytesToGB(data.tenantUsage.summary.storageBytesLastDay),
        storageBytesThisWeek: convertBytesToGB(data.tenantUsage.summary.storageBytesThisWeek),
        storageBytesThisMonth: convertBytesToGB(data.tenantUsage.summary.storageBytesThisMonth),
        storageBytesThisYear: convertBytesToGB(data.tenantUsage.summary.storageBytesThisYear),
      },
      range: {
        ...data.tenantUsage.range,
        values: data.tenantUsage.range.values.map(item => ({
          ...item,
          storageBytes: convertBytesToGB(item.storageBytes),
        })),
      },
    },
  } : null

  const chartLegends = {
    agreement: t('agreedAnnualCloudinaryUsageLegend'),
    withinPeriod: t('cloudinaryUsageWithinPeriod'),
    total: t('totalCloudinaryUsage'),
  }

  return (
    <>
      <SummaryCards summary={gbSummary} agreementLabel={t('agreedAnnualCloudinaryUsage')} unit="GB" />

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

export default CloudinaryView 