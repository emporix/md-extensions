import { describe, expect, it } from 'vitest'
import {
  formatWeekLabel,
  formatCurrency,
  formatGrowthPercent,
  buildBarChartConfig,
  buildCountLineChartConfig,
  buildCurrencyLineChartConfig,
} from './chart.helpers'

describe('formatWeekLabel', () => {
  it('returns week number and year for valid ISO timestamp', () => {
    const result = formatWeekLabel('2024-01-15T00:00:00Z')
    expect(result).toMatch(/^week \d+\/\d{4}$/)
  })

  it('returns input for invalid date', () => {
    expect(formatWeekLabel('not-a-date')).toBe('not-a-date')
  })
})

describe('formatCurrency', () => {
  it('formats number as currency', () => {
    const result = formatCurrency(1234.56, 'USD', 2)
    expect(result).toContain('1')
    expect(result).toContain('234')
  })

  it('respects maxFractionDigits', () => {
    const result = formatCurrency(100, 'EUR', 0)
    expect(result).not.toContain('.')
  })
})

describe('formatGrowthPercent', () => {
  it('adds + for positive values', () => {
    expect(formatGrowthPercent(15.7)).toBe('+16%')
  })

  it('shows - for negative values', () => {
    expect(formatGrowthPercent(-3.2)).toBe('-3%')
  })

  it('adds + for zero', () => {
    expect(formatGrowthPercent(0)).toBe('+0%')
  })

  it('rounds to integer', () => {
    expect(formatGrowthPercent(99.9)).toBe('+100%')
  })
})

describe('buildBarChartConfig', () => {
  it('returns a bar chart configuration', () => {
    const config = buildBarChartConfig({
      labels: ['week 1', 'week 2'],
      data: [100, 200],
      datasetLabel: 'Revenue',
      currency: 'EUR',
      barColor: 'rgba(0,0,255,0.5)',
      borderColor: 'rgba(0,0,255,1)',
    })
    expect(config.type).toBe('bar')
    expect(config.data.labels).toEqual(['week 1', 'week 2'])
    expect(config.data.datasets).toHaveLength(1)
    expect(config.data.datasets[0].data).toEqual([100, 200])
    expect(config.data.datasets[0].label).toBe('Revenue')
  })

  it('disables legend', () => {
    const config = buildBarChartConfig({
      labels: [],
      data: [],
      datasetLabel: 'Test',
      currency: 'USD',
      barColor: '#000',
      borderColor: '#000',
    })
    expect(config.options?.plugins?.legend?.display).toBe(false)
  })
})

describe('buildCountLineChartConfig', () => {
  it('returns a line chart configuration', () => {
    const config = buildCountLineChartConfig({
      labels: ['Mon', 'Tue'],
      data: [5, 10],
      datasetLabel: 'Orders',
      lineColor: 'green',
      fillColor: 'rgba(0,128,0,0.2)',
    })
    expect(config.type).toBe('line')
    expect(config.data.datasets[0].data).toEqual([5, 10])
    expect(config.data.datasets[0].fill).toBe(true)
  })
})

describe('buildCurrencyLineChartConfig', () => {
  it('returns a line chart configuration with currency', () => {
    const config = buildCurrencyLineChartConfig({
      labels: ['W1', 'W2', 'W3'],
      data: [1000, 2000, 1500],
      datasetLabel: 'Avg. basket',
      currency: 'EUR',
      lineColor: 'orange',
      fillColor: 'rgba(255,165,0,0.2)',
    })
    expect(config.type).toBe('line')
    expect(config.data.labels).toEqual(['W1', 'W2', 'W3'])
    expect(config.data.datasets).toHaveLength(1)
    expect(config.data.datasets[0].label).toBe('Avg. basket')
  })
})
