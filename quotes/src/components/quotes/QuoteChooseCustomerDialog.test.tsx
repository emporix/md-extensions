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
import { MemoryRouter } from 'react-router'
import i18n from '../../translations/i18n'
import QuoteChooseCustomerDialog from './QuoteChooseCustomerDialog'

const customersApi = vi.hoisted(() => ({ syncCustomers: vi.fn() }))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

vi.mock('../../hooks/api/customers', () => ({
  useCustomerApi: () => customersApi,
}))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const elle = {
  id: 'CU1',
  firstName: 'Elle',
  lastName: 'Jonson',
  contactEmail: 'elle@x.io',
  active: true,
}
const tom = {
  id: 'CU2',
  firstName: 'Tom',
  lastName: 'Fox',
  contactEmail: 'tom@x.io',
  active: false,
}

const renderDialog = () => {
  const onHide = vi.fn()
  const onCustomerSelect = vi.fn()
  render(
    <MemoryRouter initialEntries={['/add']}>
      <QuoteChooseCustomerDialog
        onHide={onHide}
        onCustomerSelect={onCustomerSelect}
      />
    </MemoryRouter>
  )
  return { onHide, onCustomerSelect }
}

const addCustomer = () =>
  screen.getByRole('button', { name: 'Add Customer' }) as HTMLButtonElement

describe('QuoteChooseCustomerDialog', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    customersApi.syncCustomers.mockResolvedValue({
      values: [elle, tom],
      totalRecords: 2,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lists the customers page by page', async () => {
    renderDialog()

    expect(screen.getByText('Available customers')).toBeTruthy()
    expect(await screen.findByText('elle@x.io')).toBeTruthy()
    expect(customersApi.syncCustomers).toHaveBeenCalledWith(
      expect.objectContaining({ currentPage: 1, rows: 10 })
    )
    expect(addCustomer().disabled).toBe(true)
  })

  it('keeps its height and scrolls only the customer rows', async () => {
    renderDialog()
    await screen.findByText('elle@x.io')

    expect(screen.getByRole('dialog').className).toMatch(/fixedHeight/)
    expect(
      screen
        .getByTestId('quote-choose-customer-dialog')
        .querySelector('[class*="fillHeight"]')
    ).not.toBeNull()
  })

  it('selects one customer, and a second click on it clears it', async () => {
    renderDialog()

    fireEvent.click(await screen.findByText('Elle'))
    expect(addCustomer().disabled).toBe(false)

    fireEvent.click(screen.getByText('Elle'))
    expect(addCustomer().disabled).toBe(true)
  })

  it('adds the selected customer and closes', async () => {
    const { onHide, onCustomerSelect } = renderDialog()

    fireEvent.click(await screen.findByText('Elle'))
    fireEvent.click(screen.getByText('Tom'))
    fireEvent.click(addCustomer())

    expect(onCustomerSelect).toHaveBeenCalledWith(tom)
    expect(onHide).toHaveBeenCalled()
  })

  it('shows an error when the customers cannot be loaded', async () => {
    customersApi.syncCustomers.mockRejectedValue('no permissions')
    renderDialog()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while fetching customers. Please try again later'
      )
    )
  })
})
