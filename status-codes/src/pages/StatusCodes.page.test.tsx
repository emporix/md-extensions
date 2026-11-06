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
import { deleteQuoteReasonCall, getQuotesReasonsCall } from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import StatusCodesPage from './StatusCodes.page'

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

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const reasons = [
  {
    id: 'r1',
    code: 'PRICE',
    type: 'CHANGE',
    message: { en: 'Price changed' },
  },
  {
    id: 'r2',
    code: 'NO_STOCK',
    type: 'DECLINE',
    message: { en: 'Out of stock' },
  },
  {
    id: 'r3',
    code: 'LATE',
    type: 'DECLINE',
    message: { en: 'Too late' },
  },
]

const renderList = () =>
  renderAt('/', { list: <StatusCodesPage />, detail: <div>detail</div> })

const tableRows = () =>
  within(screen.getByTestId('status-codes-table'))
    .getAllByRole('row')
    .filter((row) => within(row).queryByText(/PRICE|NO_STOCK|LATE/))

const rowFor = (code: string) => {
  const row = tableRows().find((r) => within(r).queryByText(code))
  if (!row) throw new Error(`no row for ${code}`)
  return row
}

const confirmDialog = () => screen.getByRole('dialog')

/** The toolbar batch-delete button (row buttons are also named Delete). */
const batchDeleteButton = () => {
  const table = screen.getByTestId('status-codes-table')
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table.contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

describe('Status codes list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.STATUS_CODES_VIEWER,
      EmployeeDomains.STATUS_CODES_MANAGER,
    ]
    vi.mocked(getQuotesReasonsCall).mockResolvedValue({
      data: reasons as never,
      totalRecords: reasons.length,
    })
    vi.mocked(deleteQuoteReasonCall).mockResolvedValue({} as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lists every status code of the tenant with code and type', async () => {
    renderList()

    expect(await screen.findByText('PRICE')).toBeTruthy()
    expect(screen.getByText('NO_STOCK')).toBeTruthy()
    expect(screen.getByText('LATE')).toBeTruthy()
    expect(screen.getByText('CHANGE')).toBeTruthy()
    expect(screen.getAllByText('DECLINE')).toHaveLength(2)
    expect(screen.getByText('Code')).toBeTruthy()
    expect(screen.getByText('Type')).toBeTruthy()
  })

  it('narrows rows to codes containing the filter text', async () => {
    renderList()
    await screen.findByText('PRICE')

    fireEvent.change(screen.getByPlaceholderText('Filter by code'), {
      target: { value: 'STO' },
    })

    await waitFor(() => expect(screen.queryByText('PRICE')).toBeNull())
    expect(screen.getByText('NO_STOCK')).toBeTruthy()
    expect(screen.queryByText('LATE')).toBeNull()
  })

  it('narrows rows by type', async () => {
    renderList()
    await screen.findByText('PRICE')

    fireEvent.change(screen.getByPlaceholderText('Filter by type'), {
      target: { value: 'CHAN' },
    })

    await waitFor(() => expect(screen.queryByText('NO_STOCK')).toBeNull())
    expect(screen.getByText('PRICE')).toBeTruthy()
  })

  it('sorts rows by code when the header is clicked', async () => {
    renderList()
    await screen.findByText('PRICE')

    fireEvent.click(screen.getByText('Code'))

    await waitFor(() =>
      expect(
        tableRows().map(
          (row) => within(row).getAllByRole('cell')[1].textContent
        )
      ).toEqual(['LATE', 'NO_STOCK', 'PRICE'])
    )
  })

  it('keeps create, row delete and batch delete disabled for a viewer', async () => {
    permissions.granted = [EmployeeDomains.STATUS_CODES_VIEWER]
    renderList()
    await screen.findByText('PRICE')

    expect(
      (screen.getByTestId('status-codes-create') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (
        within(rowFor('PRICE')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })

  it('opens the edit page on row click', async () => {
    renderList()
    fireEvent.click(await screen.findByText('LATE'))

    expect(screen.getByTestId('location').textContent).toBe('/r3')
  })

  it('opens the create page from the create button', async () => {
    renderList()
    await screen.findByText('PRICE')
    fireEvent.click(screen.getByTestId('status-codes-create'))

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  it('deletes one status code after confirmation and refreshes the list', async () => {
    renderList()
    await screen.findByText('PRICE')

    fireEvent.click(
      within(rowFor('PRICE')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Status code PRICE deleted'
      )
    )
    expect(deleteQuoteReasonCall).toHaveBeenCalledWith('', 'r1')
    await waitFor(() => expect(getQuotesReasonsCall).toHaveBeenCalledTimes(2))
  })

  it('names the code in an error toast when a delete fails', async () => {
    vi.mocked(deleteQuoteReasonCall).mockRejectedValue(new Error('boom'))
    renderList()
    await screen.findByText('PRICE')

    fireEvent.click(
      within(rowFor('PRICE')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while deleting status code PRICE',
        undefined
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
  })

  it('batch deletes the selected codes one after another with a toast each', async () => {
    const order: string[] = []
    vi.mocked(deleteQuoteReasonCall).mockImplementation(async (_t, id) => {
      order.push(`start ${id}`)
      await Promise.resolve()
      order.push(`end ${id}`)
      return {} as never
    })
    renderList()
    await screen.findByText('PRICE')

    fireEvent.click(within(rowFor('PRICE')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('LATE')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')
    fireEvent.click(batchDeleteButton())
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() => expect(toast.showSuccess).toHaveBeenCalledTimes(2))
    expect(order).toEqual(['start r1', 'end r1', 'start r3', 'end r3'])
    expect(toast.showSuccess).toHaveBeenCalledWith('Status code PRICE deleted')
    expect(toast.showSuccess).toHaveBeenCalledWith('Status code LATE deleted')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    await waitFor(() => expect(getQuotesReasonsCall).toHaveBeenCalledTimes(2))
  })
})
