import React from 'react'
import { Badge } from 'primereact/badge'
import {
  getStatusColor,
  getStatusDisplayValue,
} from '../../utils/severityHelpers'

interface StatusBadgeProps {
  status: string
  style?: React.CSSProperties
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  style = {},
  className = '',
}) => {
  const statusColor = getStatusColor(status)
  const displayValue = getStatusDisplayValue(status)

  return (
    <Badge
      value={displayValue}
      className={className}
      style={{
        border: `1px solid ${statusColor}`,
        color: statusColor,
        background: 'transparent',
        height: 'auto',
        whiteSpace: 'nowrap',
        ...style,
      }}
    />
  )
}

export default StatusBadge
