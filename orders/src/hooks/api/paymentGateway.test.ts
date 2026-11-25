/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { capturePaymentCall } from '@emporix/api-calls/next'
import { usePaymentGatewayApi } from './paymentGateway'

const dashboard = vi.hoisted(() => ({ tenant: '' }))

vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

vi.mock('@emporix/api-calls/next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/api-calls/next')>()),
  capturePaymentCall: vi.fn(),
}))

const captureCall = vi.mocked(capturePaymentCall)

const renderApi = (tenant: string) => {
  dashboard.tenant = tenant
  return renderHook(() => usePaymentGatewayApi()).result.current
}

describe('usePaymentGatewayApi.captureTransaction', () => {
  beforeEach(() => {
    captureCall.mockReset()
  })

  it('captures the amount for the dashboard tenant', async () => {
    captureCall.mockResolvedValue({ successful: true, captureId: 'cpt_1' })

    await expect(
      renderApi('mrworkerdev').captureTransaction('tx-1', 100, 'EUR')
    ).resolves.toEqual({ successful: true, captureId: 'cpt_1' })

    expect(captureCall).toHaveBeenCalledWith(
      'tx-1',
      { amount: 100, currency: 'EUR' },
      { tenant: 'mrworkerdev' }
    )
  })

  it('rejects without a tenant and sends nothing', async () => {
    await expect(
      renderApi('').captureTransaction('tx-1', 100, 'EUR')
    ).rejects.toThrow('No tenant')
    expect(captureCall).not.toHaveBeenCalled()
  })
})
