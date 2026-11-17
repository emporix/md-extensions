/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePricesApi } from './prices'
import { stubApiClient, type StubbedRequest } from '../../test/apiClientStub'
import type { PriceMatchRequest } from '../../models/Price.model'

const dashboard = vi.hoisted(() => ({ tenant: 'mytenant' as string | null }))
vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

const body = {
  targetCurrency: 'EUR',
  siteCode: 'main',
  targetLocation: { countryCode: 'DE' },
  items: [
    {
      itemId: { itemType: 'PRODUCT', id: 'p1' },
      quantity: { quantity: 2 },
    },
  ],
} as unknown as PriceMatchRequest

describe('usePricesApi on @emporix/api-calls/next', () => {
  let requests: StubbedRequest[]

  beforeEach(() => {
    dashboard.tenant = 'mytenant'
    requests = stubApiClient(() => ({
      data: [{ priceId: 'pr1', itemId: { itemType: 'PRODUCT', id: 'p1' } }],
    }))
  })

  it('matches prices with the v2 request MD sent', async () => {
    const matches = await renderHook(() =>
      usePricesApi()
    ).result.current.matchPrices(body)

    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/price/mytenant/match-prices',
      data: body,
    })
    expect(requests[0].headers['X-Version']).toBe('v2')
    expect(matches).toEqual([
      { priceId: 'pr1', itemId: { itemType: 'PRODUCT', id: 'p1' } },
    ])
  })

  it('sends nothing without a tenant', async () => {
    dashboard.tenant = null

    await expect(
      renderHook(() => usePricesApi()).result.current.matchPrices(body)
    ).rejects.toBe('no tenant')
    expect(requests).toHaveLength(0)
  })
})
