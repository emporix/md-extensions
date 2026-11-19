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

/** Reloads the quote, as a save on another tab does. */
const RefreshOnClick = () => {
  const { refreshData } = useQuoteData()
  return <button data-testid="refresh-quote" onClick={() => refreshData()} />
}

const renderApproval = ({ openAfterLoad = false } = {}) => {
  const tree = () => (
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
  const result = render(tree())
  /** Renders the same tree again, as when the permissions provider updates. */
  return { ...result, rerenderTree: () => result.rerender(tree()) }
}

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

describe('QuotesTabApproval', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    quotesApi.getQuotePdf.mockResolvedValue('%PDF')
    quotesApi.changeQuoteStatus.mockResolvedValue({})
    URL.createObjectURL = vi.fn(() => 'blob:quote-pdf')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // COP-7116 (Copilot on #158): MD never revoked the PDF URLs, so every quote
  // shown on the tab kept its PDF in memory.
  it('frees the PDF URL when a new PDF replaces it and when the tab closes', async () => {
    // A new object per load, as the API returns.
    quotesApi.getQuoteById.mockImplementation(async () => quote('OPEN'))
    URL.createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:quote-pdf-1')
      .mockReturnValueOnce('blob:quote-pdf-2')
    const { container, unmount } = render(
      <DashboardProvider appState={appState}>
        <MemoryRouter initialEntries={['/Q1']}>
          <Routes>
            <Route
              path="/:quoteId"
              element={
                <QuoteDataProvider>
                  <RefreshOnClick />
                  <QuotesTabApproval />
                </QuoteDataProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </DashboardProvider>
    )
    const src = () => container.querySelector('iframe')?.getAttribute('src')
    await waitFor(() => expect(src()).toBe('blob:quote-pdf-1'))
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    // A reloaded quote brings a new PDF.
    fireEvent.click(screen.getByTestId('refresh-quote'))
    await waitFor(() => expect(src()).toBe('blob:quote-pdf-2'))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:quote-pdf-1')

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:quote-pdf-2')
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

  // COP-7116: MD kept the quote of the first render, so Create did nothing
  // when the tab opened before the quote loaded (a `?tab=approval` link).
  it('sends the loaded quote when the tab opened before it loaded', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('CREATING'))
    renderApproval()

    fireEvent.click(await screen.findByRole('button', { name: 'Create Quote' }))

    await waitFor(() =>
      expect(quotesApi.changeQuoteStatus).toHaveBeenCalledWith('Q1', {
        value: 'OPEN',
      })
    )
  })

  // COP-7116: MD only logged a failed send.
  it('shows an error toast and stays on the quote when sending fails', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('CREATING'))
    quotesApi.changeQuoteStatus.mockRejectedValue(new Error('Network Error'))
    renderApproval({ openAfterLoad: true })

    fireEvent.click(await screen.findByRole('button', { name: 'Create Quote' }))

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Status cannot be changed',
        '',
        'error'
      )
    )
    expect(screen.queryByTestId('list')).toBeNull()
  })

  // COP-7116: MD read `e.response.data.message`, which throws in the catch
  // block when the request failed without a response.
  it('shows an error toast when an approval fails without a response', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('AWAITING'))
    quotesApi.changeQuoteStatus.mockRejectedValue(new Error('Network Error'))
    renderApproval()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve Quote' })
    )
    await waitFor(() => expect(button('Update status').disabled).toBe(false))
    fireEvent.click(button('Update status'))
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Status cannot be changed',
        '',
        'error'
      )
    )
  })

  it('shows the message of the API when a decline fails', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('IN_PROGRESS'))
    quotesApi.getQuotesReasons.mockResolvedValue({
      data: [{ id: 'R1', code: 'TOO_LATE', type: 'DECLINE' }],
    })
    quotesApi.changeQuoteStatus.mockRejectedValue({
      response: { data: { message: 'Quote is locked' } },
    })
    renderApproval()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Decline Quote' })
    )
    fireEvent.click(screen.getByTestId('quote-status-reason-control'))
    fireEvent.mouseDown(await screen.findByText('TOO_LATE'))
    const submit = () =>
      screen.getAllByRole('button', {
        name: 'Decline quote',
      })[0] as HTMLButtonElement
    await waitFor(() => expect(submit().disabled).toBe(false))
    fireEvent.click(submit())
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Quote is locked',
        '',
        'error'
      )
    )
  })

  // COP-7116: MD read `e.response.data.message` here too.
  it('shows an error toast when the decline reasons cannot be loaded', async () => {
    quotesApi.getQuoteById.mockResolvedValue(quote('IN_PROGRESS'))
    quotesApi.getQuotesReasons.mockRejectedValue(new Error('Network Error'))
    renderApproval()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Decline Quote' })
    )

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while loading the reasons',
        '',
        'error'
      )
    )
  })

  // COP-7116: MD's German decline dialog said "Angebot löschen" (delete) and
  // asked "dass Sie quote: Q1 decline wollen?".
  it('asks in German before declining', async () => {
    await i18n.changeLanguage('de')
    quotesApi.getQuoteById.mockResolvedValue(quote('IN_PROGRESS'))
    quotesApi.getQuotesReasons.mockResolvedValue({
      data: [{ id: 'R1', code: 'TOO_LATE', type: 'DECLINE' }],
    })
    renderApproval()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Angebot ablehnen' })
    )
    fireEvent.click(screen.getByTestId('quote-status-reason-control'))
    fireEvent.mouseDown(await screen.findByText('TOO_LATE'))
    // The tab's button and the dialog's submit share the name.
    const submit = () => {
      const buttons = screen.getAllByRole('button', {
        name: 'Angebot ablehnen',
      })
      return buttons[buttons.length - 1] as HTMLButtonElement
    }
    await waitFor(() => expect(submit().disabled).toBe(false))
    expect(screen.queryByText(/löschen/)).toBeNull()
    fireEvent.click(submit())

    expect(
      await screen.findByText(
        'Sind Sie sicher, dass Sie das Angebot Q1 ablehnen möchten?'
      )
    ).toBeTruthy()
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

  // COP-7116: MD memoized the buttons on the quote alone, so permissions that
  // arrived after the quote (a deep link) left them disabled.
  it('enables the actions when the permissions arrive after the quote', async () => {
    permissions.granted = []
    quotesApi.getQuoteById.mockResolvedValue(quote('AWAITING'))
    const { rerenderTree } = renderApproval()
    await waitFor(() => expect(button('Approve Quote').disabled).toBe(true))

    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    rerenderTree()

    expect(button('Approve Quote').disabled).toBe(false)
    expect(button('Decline Quote').disabled).toBe(false)
  })
})
