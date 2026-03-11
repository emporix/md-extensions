import type { ChartConfiguration } from 'chart.js'

/** Format ISO timestamp to "week N/YYYY" (ISO week) */
export const formatWeekLabel = (isoTimestamp: string): string => {
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return isoTimestamp
  const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  date.setDate(date.getDate() + 4 - (date.getDay() || 7))
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `week ${weekNo}/${date.getFullYear()}`
}

export const formatGrowthPercent = (percent: number): string => {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(0)}%`
}

export const formatCurrency = (
  value: number,
  currencyCode: string,
  maxFractionDigits = 0
): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value)
}

/* --- Shared chart config builders --- */

const GRID_LINE_COLOR = 'rgba(0,0,0,0.06)'

const currencyTooltipCallback = (currency: string) => ({
  callbacks: {
    label: (ctx: { parsed: { y: number } }) =>
      `${currency} ${ctx.parsed.y.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
  },
})

const currencyTickCallback = (currency: string) => ({
  callback: (value: string | number) =>
    `${currency} ${Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`,
})

type BarChartInput = {
  labels: string[]
  data: number[]
  datasetLabel: string
  currency: string
  barColor: string
  borderColor: string
}

export const buildBarChartConfig = ({
  labels,
  data,
  datasetLabel,
  currency,
  barColor,
  borderColor,
}: BarChartInput): ChartConfiguration<'bar'> => ({
  type: 'bar',
  data: {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        backgroundColor: barColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: currencyTooltipCallback(currency),
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID_LINE_COLOR },
        ticks: currencyTickCallback(currency),
      },
    },
  },
})

type CountLineChartInput = {
  labels: string[]
  data: number[]
  datasetLabel: string
  lineColor: string
  fillColor: string
}

export const buildCountLineChartConfig = ({
  labels,
  data,
  datasetLabel,
  lineColor,
  fillColor,
}: CountLineChartInput): ChartConfiguration<'line'> => ({
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: lineColor,
        pointRadius: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID_LINE_COLOR },
        ticks: { stepSize: 1 },
      },
    },
  },
})

type CurrencyLineChartInput = {
  labels: string[]
  data: number[]
  datasetLabel: string
  currency: string
  lineColor: string
  fillColor: string
}

export const buildCurrencyLineChartConfig = ({
  labels,
  data,
  datasetLabel,
  currency,
  lineColor,
  fillColor,
}: CurrencyLineChartInput): ChartConfiguration<'line'> => ({
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: lineColor,
        pointRadius: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: currencyTooltipCallback(currency),
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID_LINE_COLOR },
        ticks: currencyTickCallback(currency),
      },
    },
  },
})
