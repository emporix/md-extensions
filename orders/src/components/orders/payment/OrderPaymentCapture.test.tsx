/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OrderPaymentCapture from './OrderPaymentCapture'
import { isCapturable } from './paymentStatus'
import type { Payment } from '../../../models/Order.model'

const mocks = vi.hoisted(() => ({
  captureTransaction: vi.fn(),
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
vi.mock('../../../hooks/api/paymentGateway', () => ({
  usePaymentGatewayApi: () => ({
    captureTransaction: mocks.captureTransaction,
  }),
}))

const label = (key: string) => `orders.data.label.paymentInfo.${key}`

const authorized: Payment = {
  transactionId: 'tx-1',
  status: 'AUTHORIZATION_SUCCESS',
  method: 'mollie.creditcard',
  currency: 'EUR',
  authorizedAmount: 147.6,
}

const renderCapture = async (
  props: Partial<Parameters<typeof OrderPaymentCapture>[0]> = {}
) => {
  const onCaptured = vi.fn().mockResolvedValue(undefined)
  await act(async () => {
    render(
      <OrderPaymentCapture
        payment={authorized}
        currency="EUR"
        fallbackAmount={200}
        canManage
        currencyPrefix="€ "
        onCaptured={onCaptured}
        {...props}
      />
    )
  })
  return {
    onCaptured,
    input: screen.getByRole('spinbutton') as HTMLInputElement,
  }
}

const enterAmount = (input: HTMLInputElement, value: string) => {
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => value } })
}

const clickCapture = () =>
  act(async () => {
    fireEvent.click(screen.getByRole('button', { name: label('capture') }))
  })

const confirmCapture = () =>
  act(async () => {
    const buttons = screen.getAllByRole('button', { name: label('capture') })
    fireEvent.click(buttons[buttons.length - 1])
  })

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('isCapturable', () => {
  it('allows an authorized payment and a failed capture', () => {
    expect(isCapturable(authorized, undefined)).toBe(true)
    expect(
      isCapturable({ ...authorized, status: 'CAPTURE_FAILURE' }, undefined)
    ).toBe(true)
  })

  it('rejects captured, refunded and unauthorized payments', () => {
    for (const status of [
      'CAPTURE_SUCCESS',
      'REFUND_SUCCESS',
      'AUTHORIZATION_FAILURE',
      'CANCEL_SUCCESS',
    ]) {
      expect(isCapturable({ ...authorized, status }, undefined)).toBe(false)
    }
    expect(isCapturable(null, undefined)).toBe(false)
  })

  it('rejects a payment whose log already has a successful capture', () => {
    const capture = (successful: boolean) => ({
      entries: [{ type: 'CAPTURE', successful, remoteResponse: '{}' }],
    })
    expect(isCapturable(authorized, capture(true))).toBe(false)
    expect(isCapturable(authorized, capture(false))).toBe(true)
  })
})

describe('OrderPaymentCapture', () => {
  it('starts at the authorized amount and caps a larger one', async () => {
    const { input } = await renderCapture()
    expect(input.value).toBe('€ 147.60')

    enterAmount(input, '500')

    expect(input.value).toBe('€ 147.60')
  })

  it('captures the amount only after the operator confirms it', async () => {
    mocks.captureTransaction.mockResolvedValue({ successful: true })
    const { input, onCaptured } = await renderCapture()
    enterAmount(input, '100')

    await clickCapture()
    expect(mocks.captureTransaction).not.toHaveBeenCalled()
    expect(screen.getByText(label('capturePartialNote'))).toBeTruthy()

    await confirmCapture()

    expect(mocks.captureTransaction).toHaveBeenCalledWith('tx-1', 100, 'EUR')
    expect(mocks.showSuccess).toHaveBeenCalledWith(label('captureSent'))
    expect(onCaptured).toHaveBeenCalled()
  })

  it('leaves out the partial-capture note for the full amount', async () => {
    await renderCapture()
    await clickCapture()

    expect(screen.queryByText(label('capturePartialNote'))).toBeNull()
  })

  it('shows the gateway message when the gateway rejects the capture', async () => {
    mocks.captureTransaction.mockResolvedValue({
      successful: false,
      message: 'Capture amount exceeds the remaining amount',
    })
    const { onCaptured } = await renderCapture()

    await clickCapture()
    await confirmCapture()

    expect(mocks.showError).toHaveBeenCalledWith(
      label('captureError'),
      'Capture amount exceeds the remaining amount'
    )
    expect(mocks.showSuccess).not.toHaveBeenCalled()
    expect(onCaptured).not.toHaveBeenCalled()
  })

  it('shows an error when the request fails', async () => {
    mocks.captureTransaction.mockRejectedValue(new Error('Forbidden'))
    const { onCaptured } = await renderCapture()

    await clickCapture()
    await confirmCapture()

    expect(mocks.showError).toHaveBeenCalledWith(
      label('captureError'),
      undefined
    )
    expect(onCaptured).not.toHaveBeenCalled()
  })

  it('does not let a user without order permissions capture', async () => {
    const { input } = await renderCapture({ canManage: false })

    expect(input.readOnly).toBe(true)
    expect(
      (
        screen.getByRole('button', {
          name: label('capture'),
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })
})
