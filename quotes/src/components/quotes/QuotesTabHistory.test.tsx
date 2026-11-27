/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import i18n from '../../translations/i18n'
import { DashboardProvider } from '../../context/Dashboard.context'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import type { Quote } from '../../models/Quotes.model'
import QuotesTabHistory from './QuotesTabHistory'

const quotesApi = vi.hoisted(() => ({ getQuoteHistory: vi.fn() }))
vi.mock('../../hooks/api/quotes', () => ({ useQuotesApi: () => quotesApi }))
vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [] }),
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

const quote = {
  id: 'Q1',
  status: { value: 'IN_PROGRESS' },
  customer: { firstName: 'Anna', lastName: 'Morales' },
  metadata: { createdAt: '2026-11-27T10:00:00.000Z' },
} as unknown as Quote

const history = [
  {
    id: 'h1',
    path: '/status',
    newValue: { value: 'OPEN', comment: 'here is the quote' },
    userFirstName: 'Markus',
    userLastName: 'Wellner',
    userType: 'EMPLOYEE',
    modifiedAt: '2026-11-27T11:26:00.000Z',
  },
  {
    id: 'h2',
    path: '/status',
    newValue: {
      value: 'IN_PROGRESS',
      comment: 'Please give as agreed 10% discount!',
      quoteReason: {
        code: 'PRICE',
        message: { en: 'Provided price too high' },
      },
    },
    userFirstName: 'Anna',
    userLastName: 'Morales',
    userType: 'CUSTOMER',
    modifiedAt: '2026-11-27T11:28:00.000Z',
  },
]

const renderTab = () =>
  render(
    <DashboardProvider appState={appState}>
      <QuotesTabHistory quote={quote} />
    </DashboardProvider>
  )

describe('QuotesTabHistory', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    quotesApi.getQuoteHistory.mockReset()
  })
  afterEach(cleanup)

  it('lists the request and the status changes with who and the comment', async () => {
    quotesApi.getQuoteHistory.mockResolvedValue(history)
    renderTab()

    await waitFor(() =>
      expect(screen.getByText('Initial Quote Request')).toBeTruthy()
    )
    expect(quotesApi.getQuoteHistory).toHaveBeenCalledWith('Q1')
    expect(screen.getByText('Status Changed to Pending')).toBeTruthy()
    expect(screen.getByText('Status Changed to Open')).toBeTruthy()
    expect(screen.getByText('Anna Morales (CUSTOMER)')).toBeTruthy()
    expect(screen.getByText('Markus Wellner (EMPLOYEE)')).toBeTruthy()
    expect(screen.getByText('here is the quote')).toBeTruthy()
  })

  it("shows the customer's request with the reason in brackets", async () => {
    quotesApi.getQuoteHistory.mockResolvedValue(history)
    renderTab()

    expect(
      await screen.findByText(
        'Please give as agreed 10% discount! (Provided price too high)'
      )
    ).toBeTruthy()
  })

  it('shows the request alone while there is no status change', async () => {
    quotesApi.getQuoteHistory.mockResolvedValue([])
    renderTab()

    expect(await screen.findByText('Initial Quote Request')).toBeTruthy()
    expect(screen.queryByText(/Status Changed to/)).toBeNull()
  })

  it('says so when the history cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    quotesApi.getQuoteHistory.mockRejectedValue(new Error('boom'))
    renderTab()

    expect(await screen.findByTestId('quote-history-error')).toBeTruthy()
  })
})
