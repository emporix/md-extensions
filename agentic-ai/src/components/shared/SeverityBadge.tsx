import React from 'react'
import { Badge } from 'primereact/badge'
import { getSeverityColor } from '../../utils/severityHelpers'

interface SeverityBadgeProps {
  severity: string
  style?: React.CSSProperties
  className?: string
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  style = {},
  className = '',
}) => {
  const severityColor = getSeverityColor(severity)

  return (
    <Badge
      value={severity.toUpperCase()}
      className={className}
      style={{
        border: `1px solid ${severityColor}`,
        color: severityColor,
        background: 'transparent',
        height: 'auto',
        whiteSpace: 'nowrap',
        ...style,
      }}
    />
  )
}

export default SeverityBadge
