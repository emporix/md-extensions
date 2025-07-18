import React from 'react'
import { useTranslation } from 'react-i18next'
import { StatisticsSummary } from '../models/Statistics.model'

interface SummaryCardsProps {
  summary: StatisticsSummary
  agreementLabel: string
  unit?: string // Optional unit to append to values (e.g., "GB")
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, agreementLabel, unit }) => {
  const { t } = useTranslation()

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) {
      return unit ? `0 ${unit}` : '0'
    }
    const formatted = num.toLocaleString()
    return unit ? `${formatted} ${unit}` : formatted
  }

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) {
      return unit ? `0 ${unit}` : '0'
    }
    let formatted = ''
    if (num >= 1000000) {
      formatted = (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      formatted = (num / 1000).toFixed(1) + 'K'
    } else {
      formatted = num.toLocaleString()
    }
    return unit ? `${formatted} ${unit}` : formatted
  }

  return (
    <div className="statistics-cards" style={{ padding: '0 1rem' }}>
      <div className="stat-card">
        <div className="stat-card-label">{t('yesterday')}</div>
        <div className="stat-card-value">{formatNumber(summary.yesterday)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">{t('thisWeek')}</div>
        <div className="stat-card-value">{formatNumber(summary.thisWeek)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">{t('thisMonth')}</div>
        <div className="stat-card-value">{formatNumber(summary.thisMonth)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">{t('thisYear')}</div>
        <div className="stat-card-value">{formatNumber(summary.thisYear)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">{agreementLabel}</div>
        <div className="stat-card-value highlight">{formatLargeNumber(summary.agreedAnnual)}</div>
      </div>
    </div>
  )
}

export default SummaryCards 