import type { ChartConfiguration } from 'chart.js'
import type {
  OrderStatsGroupedTotal,
  OrderStatsTotalsEntry,
} from '../api/orderStats.api'
import {
  formatWeekLabel,
  buildBarChartConfig,
  buildCountLineChartConfig,
  buildCurrencyLineChartConfig,
} from './chart.helpers'

/** groupBy from order stats API: d = day, w = week, m = month, y = year */
const GROUP_BY_TO_LABEL_KEY: Record<string, string> = {
  d: 'kpi.vsLastDay',
  w: 'kpi.vsLastWeek',
  m: 'kpi.vsLastMonth',
  y: 'kpi.vsLastYear',
}

/** Returns translation key for the comparison period label based on stats groupBy. */
export const getComparisonPeriodLabelKey = (
  groupBy: string | undefined
): string => (groupBy && GROUP_BY_TO_LABEL_KEY[groupBy]) ?? 'kpi.vsLastMonth'

const BAR_COLOR = 'rgba(147, 197, 253, 0.9)'
const BAR_BORDER_COLOR = 'rgba(96, 165, 250, 1)'
const ORDERS_LINE_COLOR = 'rgb(34, 197, 94)'
const ORDERS_FILL_COLOR = 'rgba(34, 197, 94, 0.2)'
const AVG_BASKET_LINE_COLOR = 'rgb(249, 115, 22)'
const AVG_BASKET_FILL_COLOR = 'rgba(249, 115, 22, 0.2)'

export const getAverageBasket = (
  totals: OrderStatsTotalsEntry | undefined
): number | null => {
  if (
    !totals ||
    totals.gov == null ||
    totals.totalOrders == null ||
    totals.totalOrders <= 0
  ) {
    return null
  }

  return totals.gov / totals.totalOrders
}

const getWeeklyLabels = (totals: OrderStatsGroupedTotal[]): string[] =>
  totals.map((t) => formatWeekLabel(t.groupedBy.timestamp))

export const getRevenueChartConfig = (
  totals: OrderStatsGroupedTotal[],
  currency: string
): ChartConfiguration<'bar'> =>
  buildBarChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) => t.gov),
    datasetLabel: 'Revenue',
    currency,
    barColor: BAR_COLOR,
    borderColor: BAR_BORDER_COLOR,
  })

export const getOrdersChartConfig = (
  totals: OrderStatsGroupedTotal[]
): ChartConfiguration<'line'> =>
  buildCountLineChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) => t.totalOrders),
    datasetLabel: 'Orders',
    lineColor: ORDERS_LINE_COLOR,
    fillColor: ORDERS_FILL_COLOR,
  })

export const getAverageBasketChartConfig = (
  totals: OrderStatsGroupedTotal[],
  currency: string
): ChartConfiguration<'line'> =>
  buildCurrencyLineChartConfig({
    labels: getWeeklyLabels(totals),
    data: totals.map((t) =>
      t.totalOrders > 0 && t.gov != null ? t.gov / t.totalOrders : 0
    ),
    datasetLabel: 'Avg. basket',
    currency,
    lineColor: AVG_BASKET_LINE_COLOR,
    fillColor: AVG_BASKET_FILL_COLOR,
  })
