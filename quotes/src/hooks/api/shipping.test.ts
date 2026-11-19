/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useShippingApi } from './shipping'
import { stubApiClient, type StubbedRequest } from '../../test/apiClientStub'

const dashboard = vi.hoisted(() => ({ tenant: 'mytenant' as string | null }))
vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

describe('useShippingApi on @emporix/api-calls/next', () => {
  let requests: StubbedRequest[]

  beforeEach(() => {
    dashboard.tenant = 'mytenant'
    requests = stubApiClient(() => ({
      data: [
        {
          id: 'de',
          name: { en: 'Germany', de: 'Deutschland' },
          shipTo: [{ country: 'DE' }],
          methods: [
            { id: 'dhl', name: { de: 'DHL DE', en: 'DHL Standard' }, fees: [] },
            { id: 'ups', name: { de: 'UPS Paket' }, fees: [] },
            { id: 'old', name: 'Pickup', fees: [] },
          ],
        },
      ],
    }))
  })

  it('reads the zones with their methods and fees', async () => {
    await renderHook(() => useShippingApi()).result.current.getZones('main')

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: '/shipping/mytenant/main/zones',
      params: { expand: 'methods,fees' },
    })
  })

  it('names zones and methods in English, as MD read them', async () => {
    const zones = await renderHook(() =>
      useShippingApi()
    ).result.current.getZones('main')

    expect(zones[0].name).toBe('Germany')
    expect(zones[0].methods?.map((method) => method.name)).toEqual([
      'DHL Standard',
      'UPS Paket',
      'Pickup',
    ])
    expect(zones[0].shipTo).toEqual([{ country: 'DE' }])
  })

  it('sends nothing without a tenant', async () => {
    dashboard.tenant = null

    await expect(
      renderHook(() => useShippingApi()).result.current.getZones('main')
    ).rejects.toBe('no tenant')
    expect(requests).toHaveLength(0)
  })
})
