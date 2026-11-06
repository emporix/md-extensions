/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import {
  createQuoteReasonCall,
  editQuoteReasonCall,
  getQuoteReasonByIdCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import StatusCodePage from './StatusCode.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls', () => ({
  getQuotesReasonsCall: vi.fn(),
  deleteQuoteReasonCall: vi.fn(),
  getQuoteReasonByIdCall: vi.fn(),
  createQuoteReasonCall: vi.fn(),
  editQuoteReasonCall: vi.fn(),
}))

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }] }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const loaded = {
  id: 'r1',
  code: 'PRICE',
  type: 'CHANGE',
  message: { en: 'Price changed' },
  metadata: { version: 4 },
}

const renderDetail = (path: string) =>
  renderAt(path, { list: <div>list</div>, detail: <StatusCodePage /> })

const saveButton = () =>
  screen.getByTestId('status-code-save') as HTMLButtonElement
const discardButton = () =>
  screen.getByTestId('status-code-discard') as HTMLButtonElement
const codeInput = () =>
  within(screen.getByTestId('status-code-code')).queryByRole('textbox') ??
  (screen.getByTestId('status-code-code') as HTMLInputElement)
const messageInput = () =>
  within(screen.getByTestId('status-code-message')).getAllByRole(
    'textbox'
  )[0] as HTMLTextAreaElement

const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })

describe('Status code add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.STATUS_CODES_VIEWER,
      EmployeeDomains.STATUS_CODES_MANAGER,
    ]
    vi.mocked(getQuoteReasonByIdCall).mockResolvedValue(loaded as never)
    vi.mocked(createQuoteReasonCall).mockResolvedValue('new-id')
    vi.mocked(editQuoteReasonCall).mockResolvedValue({} as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('creates a status code and switches to its edit page', async () => {
    renderDetail('/add')

    type(codeInput(), 'LATE')
    type(messageInput(), 'Too late')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/new-id')
    )
    expect(createQuoteReasonCall).toHaveBeenCalledWith('', {
      type: 'CHANGE',
      code: 'LATE',
      message: { en: 'Too late' },
    })
    expect(toast.showSuccess).toHaveBeenCalledWith('Status code created!')
  })

  it('keeps save disabled while the code is empty', async () => {
    renderDetail('/add')

    type(messageInput(), 'Too late')
    type(codeInput(), '   ')

    await waitFor(() => expect(discardButton().disabled).toBe(false))
    expect(saveButton().disabled).toBe(true)
  })

  it('keeps save disabled while the comment is empty', async () => {
    renderDetail('/add')

    type(codeInput(), 'LATE')

    await waitFor(() => expect(discardButton().disabled).toBe(false))
    expect(saveButton().disabled).toBe(true)
  })

  it('shows the service message and keeps the values when create fails', async () => {
    vi.mocked(createQuoteReasonCall).mockRejectedValue({
      response: { data: { message: 'Code already exists' } },
    })
    renderDetail('/add')

    type(codeInput(), 'LATE')
    type(messageInput(), 'Too late')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Code already exists',
        undefined
      )
    )
    expect(screen.getByTestId('location').textContent).toBe('/add')
    expect((codeInput() as HTMLInputElement).value).toBe('LATE')
    expect(messageInput().value).toBe('Too late')
  })

  it('updates with the loaded version and reloads the saved values', async () => {
    renderDetail('/r1')
    await waitFor(() =>
      expect((codeInput() as HTMLInputElement).value).toBe('PRICE')
    )

    type(codeInput(), 'PRICE_UP')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Status code updated')
    )
    expect(editQuoteReasonCall).toHaveBeenCalledWith('', 'r1', {
      type: 'CHANGE',
      code: 'PRICE_UP',
      message: { en: 'Price changed' },
      metadata: { version: 4 },
    })
    await waitFor(() => expect(getQuoteReasonByIdCall).toHaveBeenCalledTimes(2))
  })

  it('falls back to a generic title when the service sends no message', async () => {
    vi.mocked(createQuoteReasonCall).mockRejectedValue(new Error('offline'))
    renderDetail('/add')

    type(codeInput(), 'LATE')
    type(messageInput(), 'Too late')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while saving status code',
        undefined
      )
    )
  })

  it('shows the service message when an update fails', async () => {
    vi.mocked(editQuoteReasonCall).mockRejectedValue({
      response: { data: { message: 'Version conflict' } },
    })
    renderDetail('/r1')
    await waitFor(() =>
      expect((codeInput() as HTMLInputElement).value).toBe('PRICE')
    )

    type(codeInput(), 'PRICE_UP')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Version conflict',
        undefined
      )
    )
    expect((codeInput() as HTMLInputElement).value).toBe('PRICE_UP')
  })

  it('returns the form to the loaded values on discard', async () => {
    renderDetail('/r1')
    await waitFor(() =>
      expect((codeInput() as HTMLInputElement).value).toBe('PRICE')
    )

    type(codeInput(), 'OTHER')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    fireEvent.click(discardButton())

    await waitFor(() =>
      expect((codeInput() as HTMLInputElement).value).toBe('PRICE')
    )
    expect(saveButton().disabled).toBe(true)
  })

  it('goes back to the list with an error when the code cannot be loaded', async () => {
    vi.mocked(getQuoteReasonByIdCall).mockRejectedValue(new Error('404'))
    renderDetail('/missing')

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/')
    )
    expect(toast.showError).toHaveBeenCalledWith(
      'Error while loading status codes. Please try again later',
      undefined
    )
  })

  it('makes the form read-only for a viewer', async () => {
    permissions.granted = [EmployeeDomains.STATUS_CODES_VIEWER]
    renderDetail('/r1')
    await waitFor(() =>
      expect((codeInput() as HTMLInputElement).value).toBe('PRICE')
    )

    expect((codeInput() as HTMLInputElement).disabled).toBe(true)
    expect(messageInput().disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
  })
})
