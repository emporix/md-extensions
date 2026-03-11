import { describe, expect, it } from 'vitest'
import type { QuoteStatsTotalsEntry } from '../api/quoteStats.api'
import {
  getAverageQuoteValue,
  getAcceptedQuotesCount,
  getCancelledQuotesCount,
  getQuoteVolumeChartConfig,
  getQuotesChartConfig,
  getAverageQuoteValueChartConfig,
} from './quoteStats.helpers'

const minimalTotals = (
  overrides: Partial<QuoteStatsTotalsEntry> = {}
): QuoteStatsTotalsEntry => ({
  gov: 0,
  netgov: 0,
  totalQuotes: 0,
  statuses: {},
  ...overrides,
})

describe('getAverageQuoteValue', () => {
  it('returns gov / totalQuotes when both present and totalQuotes > 0', () => {
    const totals = minimalTotals({ gov: 1000, totalQuotes: 10 })
    expect(getAverageQuoteValue(totals)).toBe(100)
  })

  it('returns null when totals is undefined', () => {
    expect(getAverageQuoteValue(undefined)).toBeNull()
  })

  it('returns null when totalQuotes is 0', () => {
    const totals = minimalTotals({ gov: 100, totalQuotes: 0 })
    expect(getAverageQuoteValue(totals)).toBeNull()
  })

  it('returns null when gov or totalQuotes is missing', () => {
    expect(
      getAverageQuoteValue({
        netgov: 0,
        totalQuotes: 5,
        statuses: {},
      } as QuoteStatsTotalsEntry)
    ).toBeNull()
    expect(
      getAverageQuoteValue({
        gov: 100,
        netgov: 0,
        statuses: {},
      } as QuoteStatsTotalsEntry)
    ).toBeNull()
  })

  it('does not mutate input', () => {
    const totals = minimalTotals({ gov: 200, totalQuotes: 4 })
    getAverageQuoteValue(totals)
    expect(totals.gov).toBe(200)
    expect(totals.totalQuotes).toBe(4)
  })
})

describe('getAcceptedQuotesCount', () => {
  it('returns ACCEPTED count from statuses', () => {
    const totals = minimalTotals({ statuses: { ACCEPTED: 11 } })
    expect(getAcceptedQuotesCount(totals)).toBe(11)
  })

  it('returns 0 when totals or statuses missing', () => {
    expect(getAcceptedQuotesCount(undefined)).toBe(0)
    expect(getAcceptedQuotesCount({} as QuoteStatsTotalsEntry)).toBe(0)
    expect(getAcceptedQuotesCount(minimalTotals())).toBe(0)
  })

  it('returns 0 when ACCEPTED undefined', () => {
    const totals = minimalTotals({ statuses: { OPEN: 1 } })
    expect(getAcceptedQuotesCount(totals)).toBe(0)
  })
})

describe('getCancelledQuotesCount', () => {
  it('sums DECLINED, DECLINED_BY_MERCHANT, EXPIRED', () => {
    const totals = minimalTotals({
      statuses: {
        DECLINED: 1,
        DECLINED_BY_MERCHANT: 2,
        EXPIRED: 3,
      },
    })
    expect(getCancelledQuotesCount(totals)).toBe(6)
  })

  it('returns 0 when totals or statuses missing', () => {
    expect(getCancelledQuotesCount(undefined)).toBe(0)
    expect(getCancelledQuotesCount({} as QuoteStatsTotalsEntry)).toBe(0)
  })

  it('treats missing status keys as 0', () => {
    const totals = minimalTotals({ statuses: { DECLINED: 1 } })
    expect(getCancelledQuotesCount(totals)).toBe(1)
  })

  it('does not mutate input', () => {
    const totals = minimalTotals({ statuses: { DECLINED: 1, EXPIRED: 2 } })
    getCancelledQuotesCount(totals)
    expect(totals.statuses.DECLINED).toBe(1)
    expect(totals.statuses.EXPIRED).toBe(2)
  })
})

describe('chart configs', () => {
  const groupedTotals = [
    {
      groupedBy: { currencyISOCode: 'EUR', timestamp: '2025-01-01T00:00:00Z' },
      gov: 1000,
      totalQuotes: 5,
      netgov: 800,
      statuses: {},
    },
    {
      groupedBy: { currencyISOCode: 'EUR', timestamp: '2025-02-01T00:00:00Z' },
      gov: 2000,
      totalQuotes: 10,
      netgov: 1600,
      statuses: {},
    },
  ]

  it('getQuoteVolumeChartConfig returns bar config with gov values', () => {
    const config = getQuoteVolumeChartConfig(groupedTotals, 'EUR')
    expect(config.type).toBe('bar')
    expect(config.data?.datasets?.[0]?.data).toEqual([1000, 2000])
  })

  it('getQuotesChartConfig returns line config with totalQuotes values', () => {
    const config = getQuotesChartConfig(groupedTotals)
    expect(config.type).toBe('line')
    expect(config.data?.datasets?.[0]?.data).toEqual([5, 10])
  })

  it('getAverageQuoteValueChartConfig returns line config with avg values', () => {
    const config = getAverageQuoteValueChartConfig(groupedTotals, 'EUR')
    expect(config.type).toBe('line')
    expect(config.data?.datasets?.[0]?.data).toEqual([200, 200])
  })

  it('getAverageQuoteValueChartConfig uses zero when gov is null', () => {
    const totalsWithNullGov = [
      {
        groupedBy: {
          currencyISOCode: 'EUR',
          timestamp: '2025-01-01T00:00:00Z',
        },
        gov: null,
        totalQuotes: 3,
        netgov: 0,
        statuses: {},
      },
    ] as unknown as typeof groupedTotals

    const config = getAverageQuoteValueChartConfig(totalsWithNullGov, 'EUR')
    expect(config.data?.datasets?.[0]?.data).toEqual([0])
  })

  it('chart configs do not mutate input', () => {
    const copy = groupedTotals.map((t) => ({ ...t }))
    getQuoteVolumeChartConfig(copy, 'EUR')
    getQuotesChartConfig(copy)
    getAverageQuoteValueChartConfig(copy, 'EUR')
    expect(copy).toEqual(groupedTotals)
  })
})
