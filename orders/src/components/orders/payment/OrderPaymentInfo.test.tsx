/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OrderPaymentInfo from './OrderPaymentInfo'

const mocks = vi.hoisted(() => ({
  // Net prices: totalPrice (390.95) leaves out the item tax; 464.10 was captured.
  order: {
    id: 'order-1',
    currency: 'EUR',
    totalPrice: 390.95,
    payments: [
      {
        transactionId: 'tx-1',
        status: 'CAPTURE_SUCCESS',
        currency: 'EUR',
        paidAmount: 464.1,
        authorizedAmount: 464.1,
      },
    ],
  },
  fetchTransaction: vi.fn(),
  refreshData: vi.fn(),
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
  useOrderData: () => ({
    order: mocks.order,
    refreshData: mocks.refreshData,
  }),
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

const entry = (type: string, amount: number, successful = true) => ({
  id: `${type}-${amount}-${successful}`,
  type,
  successful,
  remoteResponse: '{}',
  amount: { amount, currency: 'EUR' },
})

const renderInfo = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <OrderPaymentInfo />
      </MemoryRouter>
    )
  })
}

const enterRefund = (value: string) => {
  const input = screen.getByRole('spinbutton') as HTMLInputElement
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => value } })
  return input
}

const clickRefund = async () => {
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: 'orders.data.label.paymentInfo.refund',
      })
    )
  })
}

beforeEach(() => {
  mocks.refundTransaction.mockResolvedValue(undefined)
  mocks.refreshData.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('OrderPaymentInfo refund', () => {
  it('allows refunding the whole captured amount, including tax missing from totalPrice', async () => {
    mocks.fetchTransaction.mockResolvedValue({
      entries: [entry('CAPTURE', 464.1)],
    })
    await renderInfo()

    expect(enterRefund('500').value).toBe('€ 464.10')
    await clickRefund()

    expect(mocks.refundTransaction).toHaveBeenCalledWith('tx-1', 464.1, 'EUR')
  })

  it('limits the next refund to what is left and ignores failed refunds', async () => {
    mocks.fetchTransaction.mockResolvedValue({
      entries: [
        entry('CAPTURE', 464.1),
        entry('REFUND', 100),
        entry('REFUND', 50, false),
      ],
    })
    await renderInfo()

    expect(enterRefund('500').value).toBe('€ 364.10')
  })

  it('keeps the refund box after a refund and reloads the log and the order', async () => {
    mocks.fetchTransaction
      .mockResolvedValueOnce({ entries: [entry('CAPTURE', 464.1)] })
      .mockResolvedValue({
        entries: [entry('CAPTURE', 464.1), entry('REFUND', 100)],
      })
    await renderInfo()

    enterRefund('100')
    await clickRefund()

    expect(mocks.refreshData).toHaveBeenCalled()
    expect(enterRefund('500').value).toBe('€ 364.10')
  })

  it('says so when everything captured has been refunded', async () => {
    mocks.fetchTransaction.mockResolvedValue({
      entries: [entry('CAPTURE', 464.1), entry('REFUND', 464.1)],
    })
    await renderInfo()

    expect(screen.queryByRole('spinbutton')).toBeNull()
    expect(
      screen.getByText('orders.data.label.paymentInfo.fullyRefunded')
    ).toBeTruthy()
  })
})
