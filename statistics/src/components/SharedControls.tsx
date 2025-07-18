import React from 'react'
import { Button } from 'primereact/button'
import TimeUnitSelector from './TimeUnitSelector'
import DateRangePicker from './DateRangePicker'
import { TimeUnit } from '../models/Statistics.model'

interface SharedControlsProps {
  timeUnit: TimeUnit
  startDate: Date
  endDate: Date
  onTimeUnitChange: (unit: TimeUnit) => void
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  onDownloadCSV?: () => void
  downloadLabel?: string
}

const SharedControls: React.FC<SharedControlsProps> = ({
  timeUnit,
  startDate,
  endDate,
  onTimeUnitChange,
  onStartDateChange,
  onEndDateChange,
  onDownloadCSV,
  downloadLabel = 'Download CSV',
}) => {
  return (
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
          label={downloadLabel}
          icon="pi pi-download"
          onClick={onDownloadCSV}
          className="p-button-sm"
          style={{ marginLeft: '0.5rem' }}
        />
      )}
    </div>
  )
}

export default SharedControls 