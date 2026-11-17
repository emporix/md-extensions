/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import { QuoteDataProvider, useQuoteData } from '../../context/Quote.provider'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import QuotesTabApproval from './QuotesTabApproval'

const quotesApi = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  getQuotePdf: vi.fn(),
  changeQuoteStatus: vi.fn(),
  getQuotesReasons: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../../hooks/api/quotes', () => ({ useQuotesApi: () => quotesApi }))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: [],
  }),
}))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

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

const quote = (status: string) => ({
  id: 'Q1',
  status: { value: status },
  businessModel: 'B2B',
  items: [],
  metadata: { mixins: {} },
})

/** The tab opened once the quote is loaded, as when a user switches to it. */
const ApprovalOnceLoaded = () =>
  useQuoteData().quote ? <QuotesTabApproval /> : null

const renderApproval = ({ openAfterLoad = false } = {}) =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={['/Q1']}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                {openAfterLoad ? <ApprovalOnceLoaded /> : <QuotesTabApproval />}
              </QuoteDataProvider>
            }
          />
          <Route path="/" element={<div data-testid="list" />} />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

describe('QuotesTabApproval', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    quotesApi.getQuotePdf.mockResolvedValue('%PDF')
    quotesApi.changeQuoteStatus.mockResolvedValue({})
    URL.createObjectURL = vi.fn(() => 'blob:quote-pdf')
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the PDF of the quote', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('OPEN'))
    const { container } = renderApproval()

    await waitFor(() =>
      expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
        'blob:quote-pdf'
      )
    )
    expect(quotesApi.getQuotePdf).toHaveBeenCalledWith('Q1')
    // An open quote offers no action.
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('approves an awaiting quote after the confirm step', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('AWAITING'))
    renderApproval()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve Quote' })
    )
    expect(screen.getByText('Change quote status')).toBeTruthy()
    // No reason for an approval.
    expect(screen.queryByText('Reason')).toBeNull()
    fireEvent.change(screen.getByTestId('quote-status-comment-input'), {
      target: { value: 'Looks good' },
    })
    await waitFor(() => expect(button('Update status').disabled).toBe(false))
    fireEvent.click(button('Update status'))
    expect(
      await screen.findByText('Are you sure you want to change quote: Q1?')
    ).toBeTruthy()
    fireEvent.click(button('Yes'))

    await waitFor(() =>
      expect(quotesApi.changeQuoteStatus).toHaveBeenCalledWith('Q1', {
        value: 'OPEN',
        comment: 'Looks good',
      })
    )
    expect(toast.showToast).toHaveBeenCalledWith(
      'Quote approved',
      '',
      'success'
    )
    expect(quotesApi.getQuotesReasons).not.toHaveBeenCalled()
  })

  // COP-7116: a decline needs a reason (MD let it be empty).
  it('declines only with a reason of the decline type', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('IN_PROGRESS'))
    quotesApi.getQuotesReasons.mockResolvedValue({
      data: [
        { id: 'R1', code: 'TOO_LATE', type: 'DECLINE' },
        { id: 'R2', code: 'CHANGED', type: 'CHANGE' },
      ],
    })
    renderApproval()
    const submit = () =>
      screen.getAllByRole('button', {
        name: 'Decline quote',
      })[0] as HTMLButtonElement

    fireEvent.click(
      await screen.findByRole('button', { name: 'Decline Quote' })
    )
    expect(screen.getByText('Reason')).toBeTruthy()
    await waitFor(() => expect(quotesApi.getQuotesReasons).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('quote-status-reason-control'))
    // Only reasons of the decline type are offered.
    expect(await screen.findByText('TOO_LATE')).toBeTruthy()
    expect(screen.queryByText('CHANGED')).toBeNull()
    // Without a reason the decline cannot be submitted.
    expect(submit().disabled).toBe(true)

    // CL Dropdown selects an option on mouse down.
    fireEvent.mouseDown(screen.getByText('TOO_LATE'))
    await waitFor(() => expect(submit().disabled).toBe(false))
    fireEvent.click(submit())
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(quotesApi.changeQuoteStatus).toHaveBeenCalledWith('Q1', {
        value: 'DECLINED_BY_MERCHANT',
        quoteReasonId: 'R1',
      })
    )
  })

  it('sends a quote that is being created and returns to the list', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('CREATING'))
    renderApproval({ openAfterLoad: true })

    fireEvent.click(await screen.findByRole('button', { name: 'Create Quote' }))

    await waitFor(() =>
      expect(quotesApi.changeQuoteStatus).toHaveBeenCalledWith('Q1', {
        value: 'OPEN',
      })
    )
    expect(toast.showToast).toHaveBeenCalledWith(
      'Quote created!',
      '',
      'success'
    )
    expect(await screen.findByTestId('list')).toBeTruthy()
  })

  it('keeps the quote of its first render for Create (MD quirk)', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('CREATING'))
    // Opened before the quote loaded (e.g. a `?tab=approval` link).
    renderApproval()

    fireEvent.click(await screen.findByRole('button', { name: 'Create Quote' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(quotesApi.changeQuoteStatus).not.toHaveBeenCalled()
  })

  it('disables the actions without Quotes Manager', async () => {
    permissions.granted = []
    quotesApi.getQuoteById.mockResolvedValue(quote('AWAITING'))
    renderApproval()

    expect(
      (
        (await screen.findByRole('button', {
          name: 'Approve Quote',
        })) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(button('Decline Quote').disabled).toBe(true)
  })
})
