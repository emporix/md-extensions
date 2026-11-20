/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import type { Quote } from '../../models/Quotes.model'
import QuotesTabGeneralStatus from './QuotesTabGeneralStatus'

const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: [],
  }),
}))

const appState: AppState = {
  tenant: 'tenant-a',
  language: 'en',
  token: 'token',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
}

const renderBox = (quote: Partial<Quote>) =>
  render(
    <DashboardProvider appState={appState}>
      <QuotesTabGeneralStatus quote={quote as Quote} />
    </DashboardProvider>
  )

/**
 * The status box above the quote's tabs (COP-7116 QA; MD showed it on the
 * General tab of a completed quote only).
 */
describe('QuotesTabGeneralStatus', () => {
  const originalLocation = window.location
  const assign = vi.fn()

  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = []
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    })
  })

  afterEach(() => {
    cleanup()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    vi.clearAllMocks()
  })

  it('opens the order of an accepted quote in the orders remote', () => {
    permissions.granted = [EmployeeDomains.ORDERS_VIEWER]
    renderBox({ orderId: 'EON4365', status: { value: 'ACCEPTED' } as never })

    fireEvent.click(screen.getByText('EON4365'))

    expect(assign).toHaveBeenCalledWith('/apps/management/orders#/EON4365')
  })

  // COP-7116 (Copilot on #158): MD linked the order for everyone, also
  // without Orders Viewer.
  it('shows the order number without a link without Orders Viewer', () => {
    renderBox({ orderId: 'EON4365', status: { value: 'ACCEPTED' } as never })

    const orderNumber = screen.getByText('EON4365')
    expect(orderNumber.closest('a')).toBeNull()
    fireEvent.click(orderNumber)
    expect(assign).not.toHaveBeenCalled()
  })

  it('shows the reason and message of an open quote without an order column', () => {
    renderBox({
      status: {
        value: 'IN_PROGRESS',
        comment: 'Please lower the price',
        quoteReason: { id: 'R1', code: 'PRICE_TOO_HIGH' },
      } as never,
    })

    const box = screen.getByTestId('quote-status-box')
    expect(box.textContent).toContain('PRICE_TOO_HIGH')
    expect(box.textContent).toContain('Please lower the price')
    expect(box.textContent).not.toContain('Order number')
  })
})
