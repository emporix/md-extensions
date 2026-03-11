import { describe, expect, it } from 'vitest'
import type {
  OrderStatsGroupedTotal,
  OrderStatsTotalsEntry,
} from '../api/orderStats.api'
import {
  getAverageBasket,
  getAverageBasketChartConfig,
  getComparisonPeriodLabelKey,
  getOrdersChartConfig,
  getRevenueChartConfig,
} from './orderStats.helpers'

describe('getComparisonPeriodLabelKey', () => {
  it('returns kpi.vsLastDay for groupBy d', () => {
    expect(getComparisonPeriodLabelKey('d')).toBe('kpi.vsLastDay')
  })

  it('returns kpi.vsLastWeek for groupBy w', () => {
    expect(getComparisonPeriodLabelKey('w')).toBe('kpi.vsLastWeek')
  })

  it('returns kpi.vsLastMonth for groupBy m', () => {
    expect(getComparisonPeriodLabelKey('m')).toBe('kpi.vsLastMonth')
  })

  it('returns kpi.vsLastYear for groupBy y', () => {
    expect(getComparisonPeriodLabelKey('y')).toBe('kpi.vsLastYear')
  })

  it('returns kpi.vsLastMonth for undefined groupBy', () => {
    expect(getComparisonPeriodLabelKey(undefined)).toBe('kpi.vsLastMonth')
  })

  it('returns kpi.vsLastMonth for unknown groupBy', () => {
    expect(getComparisonPeriodLabelKey('x')).toBe('kpi.vsLastMonth')
  })
})

describe('getAverageBasket', () => {
  it('returns gov / totalOrders', () => {
    const totals: OrderStatsTotalsEntry = {
      gov: 100,
      totalOrders: 4,
    } as OrderStatsTotalsEntry
    expect(getAverageBasket(totals)).toBe(25)
  })

  it('returns null for zero orders', () => {
    expect(
      getAverageBasket({ gov: 100, totalOrders: 0 } as OrderStatsTotalsEntry)
    ).toBeNull()
  })

  it('returns null for undefined totals', () => {
    expect(getAverageBasket(undefined)).toBeNull()
  })
})

describe('getRevenueChartConfig', () => {
  const sampleTotals: OrderStatsGroupedTotal[] = [
    {
      groupedBy: { currencyISOCode: 'EUR', timestamp: '2025-01-06T00:00:00Z' },
      gov: 1200,
      totalOrders: 5,
      fees: 0,
      netgov: 1100,
    },
    {
      groupedBy: { currencyISOCode: 'EUR', timestamp: '2025-01-13T00:00:00Z' },
      gov: 800,
      totalOrders: 3,
      fees: 0,
      netgov: 750,
    },
  ]

  it('returns bar chart config', () => {
    const config = getRevenueChartConfig(sampleTotals, 'EUR')
    expect(config.type).toBe('bar')
    expect(config.data.labels).toHaveLength(2)
    expect(config.data.datasets[0].data).toEqual([1200, 800])
  })
})

describe('getOrdersChartConfig', () => {
  const sampleTotals: OrderStatsGroupedTotal[] = [
    {
      groupedBy: { currencyISOCode: 'EUR', timestamp: '2025-01-06T00:00:00Z' },
      gov: 1200,
      totalOrders: 5,
      fees: 0,
      netgov: 1100,
    },
  ]

  it('returns line chart config with order counts', () => {
    const config = getOrdersChartConfig(sampleTotals)
    expect(config.type).toBe('line')
    expect(config.data.datasets[0].data).toEqual([5])
  })
})

describe('getAverageBasketChartConfig', () => {
  it('uses zero value when gov is null', () => {
    const totals = [
      {
        groupedBy: {
          currencyISOCode: 'EUR',
          timestamp: '2025-01-01T00:00:00Z',
        },
        gov: null,
        totalOrders: 2,
        fees: 0,
        netgov: 0,
      },
    ] as unknown as OrderStatsGroupedTotal[]

    const config = getAverageBasketChartConfig(totals, 'EUR')
    expect(config.data?.datasets?.[0]?.data).toEqual([0])
  })

  it('computes average per data point', () => {
    const totals: OrderStatsGroupedTotal[] = [
      {
        groupedBy: {
          currencyISOCode: 'EUR',
          timestamp: '2025-01-06T00:00:00Z',
        },
        gov: 100,
        totalOrders: 4,
        fees: 0,
        netgov: 90,
      },
    ]
    const config = getAverageBasketChartConfig(totals, 'EUR')
    expect(config.data.datasets[0].data).toEqual([25])
  })
})
