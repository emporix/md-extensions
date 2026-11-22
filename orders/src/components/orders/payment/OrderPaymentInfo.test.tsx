/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OrderPaymentInfo from './OrderPaymentInfo'

const mocks = vi.hoisted(() => ({
  order: {
    id: 'order-1',
    currency: 'EUR',
    totalPrice: 100,
    payments: [
      { transactionId: 'tx-1', status: 'CAPTURE_SUCCESS', currency: 'EUR' },
    ],
  },
  fetchTransaction: vi.fn(),
  refundTransaction: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  useToast: () => ({
    showSuccess: mocks.showSuccess,
    showError: mocks.showError,
  }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))
vi.mock('../../../contexts/OrderData.provider', () => ({
  useOrderData: () => ({ order: mocks.order }),
}))
vi.mock('../../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))
vi.mock('../../../hooks/api/paymentGateway', () => ({
  usePaymentGatewayApi: () => ({
    fetchTransaction: mocks.fetchTransaction,
    refundTransaction: mocks.refundTransaction,
  }),
}))

beforeEach(() => {
  // 20 of the 100 total were refunded already, so at most 80 is left.
  mocks.fetchTransaction.mockResolvedValue({
    entries: [
      {
        id: 'entry-1',
        type: 'REFUND',
        successful: true,
        remoteResponse: '{}',
        amount: { amount: 20, currency: 'EUR' },
      },
    ],
  })
  mocks.refundTransaction.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('OrderPaymentInfo', () => {
  it('refunds at most what is left when a larger amount is entered', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <OrderPaymentInfo />
        </MemoryRouter>
      )
    })
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    input.setSelectionRange(0, input.value.length)
    fireEvent.paste(input, { clipboardData: { getData: () => '150' } })

    expect(input.value).toBe('€ 80.00')

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'orders.data.label.paymentInfo.refund',
        })
      )
    })

    expect(mocks.refundTransaction).toHaveBeenCalledWith('tx-1', 80, 'EUR')
  })
})
