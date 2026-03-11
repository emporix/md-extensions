import type { ChartConfiguration } from 'chart.js'
import type {
  QuoteStatsGroupedTotal,
  QuoteStatsTotalsEntry,
  QuoteStatsStatuses,
} from '../api/quoteStats.api'
import { getComparisonPeriodLabelKey } from './orderStats.helpers'
import {
  formatWeekLabel,
  buildBarChartConfig,
  buildCountLineChartConfig,
  buildCurrencyLineChartConfig,
} from './chart.helpers'

export { getComparisonPeriodLabelKey }

const BAR_COLOR = 'rgba(167, 139, 250, 0.9)'
const BAR_BORDER_COLOR = 'rgba(139, 92, 246, 1)'
const QUOTES_LINE_COLOR = 'rgb(34, 197, 94)'
const QUOTES_FILL_COLOR = 'rgba(34, 197, 94, 0.2)'
const AVG_QUOTE_LINE_COLOR = 'rgb(249, 115, 22)'
const AVG_QUOTE_FILL_COLOR = 'rgba(249, 115, 22, 0.2)'

export const getAverageQuoteValue = (
  totals: QuoteStatsTotalsEntry | undefined
): number | null => {
  if (
    !totals ||
    totals.gov == null ||
    totals.totalQuotes == null ||
    totals.totalQuotes <= 0
  ) {
    return null
  }
  return totals.gov / totals.totalQuotes
}

export const getAcceptedQuotesCount = (
  totals: QuoteStatsTotalsEntry | undefined
): number => totals?.statuses?.ACCEPTED ?? 0

const CANCELLED_STATUSES: (keyof QuoteStatsStatuses)[] = [
  'DECLINED',
  'DECLINED_BY_MERCHANT',
  'EXPIRED',
]

export const getCancelledQuotesCount = (
  totals: QuoteStatsTotalsEntry | undefined
): number => {
  if (!totals?.statuses) return 0
  return CANCELLED_STATUSES.reduce(
    (sum, key) => sum + (totals.statuses[key] ?? 0),
    0
  )
}

const getWeeklyLabels = (totals: QuoteStatsGroupedTotal[]): string[] =>
  totals.map((t) => formatWeekLabel(t.groupedBy.timestamp))

export const getQuoteVolumeChartConfig = (
  totals: QuoteStatsGroupedTotal[],
  currency: string
): ChartConfiguration<'bar'> =>
  buildBarChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) => t.gov),
    datasetLabel: 'Quote volume',
    currency,
    barColor: BAR_COLOR,
    borderColor: BAR_BORDER_COLOR,
  })

export const getQuotesChartConfig = (
  totals: QuoteStatsGroupedTotal[]
): ChartConfiguration<'line'> =>
  buildCountLineChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) => t.totalQuotes),
    datasetLabel: 'Quotes',
    lineColor: QUOTES_LINE_COLOR,
    fillColor: QUOTES_FILL_COLOR,
  })

export const getAverageQuoteValueChartConfig = (
  totals: QuoteStatsGroupedTotal[],
  currency: string
): ChartConfiguration<'line'> =>
  buildCurrencyLineChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) =>
      t.totalQuotes > 0 && t.gov != null ? t.gov / t.totalQuotes : 0
    ),
    datasetLabel: 'Avg. quote value',
    currency,
    lineColor: AVG_QUOTE_LINE_COLOR,
    fillColor: AVG_QUOTE_FILL_COLOR,
  })
