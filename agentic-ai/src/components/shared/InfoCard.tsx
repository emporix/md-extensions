import React from 'react'

interface InfoCardProps {
  label: string
  value: string | React.ReactNode
  isTag?: boolean
}

export const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  isTag = false,
}) => {
  return (
    <div className="info-card">
      <div className="info-label">{label}</div>
      {isTag ? (
        <div className="info-value-tag">{value}</div>
      ) : (
        <div className="info-value">{value}</div>
      )}
    </div>
  )
}

export default InfoCard
