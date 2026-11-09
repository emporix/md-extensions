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
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import i18n from '../../translations/i18n'
import { RefreshValuesProvider } from '../../context/RefreshValuesProvider'
import { ContactAssignmentList } from './ContactAssignmentList'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const api = vi.hoisted(() => ({
  getContactsForEntity: vi.fn(),
  deleteContactAssignment: vi.fn(),
  deleteCustomer: vi.fn(),
}))

vi.mock('../../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => ({
    getContactsForEntity: api.getContactsForEntity,
    deleteContactAssignment: api.deleteContactAssignment,
  }),
}))

vi.mock('../../hooks/api/customers', () => ({
  useCustomerApi: () => ({ deleteCustomer: api.deleteCustomer }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const assignments = [
  {
    id: 'as-1',
    type: 'PRIMARY',
    primary: true,
    legalEntity: { id: 'C-1' },
    customer: {
      id: 'cust-1',
      name: 'Ann',
      surname: 'Smith',
      email: 'ann@x.io',
      type: 'CONTACT',
    },
  },
  {
    id: 'as-2',
    type: 'BILLING',
    primary: false,
    legalEntity: { id: 'C-1' },
    customer: {
      id: 'cust-2',
      name: 'Bob',
      surname: 'Jones',
      email: 'bob@x.io',
      type: 'CUSTOMER',
    },
  },
]

const LocationDisplay = () => (
  <div data-testid="location">{useLocation().pathname}</div>
)

const renderList = (managerPermissions = true) =>
  render(
    <MemoryRouter initialEntries={['/C-1']}>
      <RefreshValuesProvider>
        <Routes>
          <Route
            path="*"
            element={
              <ContactAssignmentList
                legalEntity={{ id: 'C-1' }}
                managerPermissions={managerPermissions}
              />
            }
          />
        </Routes>
        <LocationDisplay />
      </RefreshValuesProvider>
    </MemoryRouter>
  )

const table = () => screen.getByTestId('contact-assignments-table')

const rowFor = (text: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(text))
  if (!row) throw new Error(`no row for ${text}`)
  return row
}

const confirm = () =>
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  )

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

describe('ContactAssignmentList', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    api.getContactsForEntity.mockResolvedValue(assignments)
    api.deleteContactAssignment.mockResolvedValue({})
    api.deleteCustomer.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // S15
  it('lists the assignments of the company with the MD columns', async () => {
    renderList()

    expect(await screen.findByText('Ann')).toBeTruthy()
    expect(api.getContactsForEntity).toHaveBeenCalledWith('C-1')
    expect(within(rowFor('Ann')).getByText('Smith')).toBeTruthy()
    expect(within(rowFor('Ann')).getByText('ann@x.io')).toBeTruthy()
    expect(
      within(rowFor('Ann')).getByText(i18n.t('contacts.assignment.contactType'))
    ).toBeTruthy()
    expect(
      within(rowFor('Bob')).getByText(
        i18n.t('contacts.assignment.customerType')
      )
    ).toBeTruthy()
    expect(within(rowFor('Ann')).getByTestId('dot-indicator')).toBeTruthy()
    for (const key of [
      'contacts.name',
      'contacts.surname',
      'contacts.primary',
      'contacts.contactType',
      'contacts.assignment.userType',
      'contacts.emailAddress',
    ]) {
      expect(within(table()).getAllByText(i18n.t(key)).length).toBeGreaterThan(
        0
      )
    }
  })

  it('deletes the customer too when a CONTACT-type assignment is deleted', async () => {
    renderList()
    await screen.findByText('Ann')

    fireEvent.click(
      within(rowFor('Ann')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('contacts.toasts.deleteSuccess')
      )
    )
    expect(api.deleteContactAssignment).toHaveBeenCalledWith('as-1')
    expect(api.deleteCustomer).toHaveBeenCalledWith('cust-1')
    await waitFor(() =>
      expect(api.getContactsForEntity).toHaveBeenCalledTimes(2)
    )
  })

  it('only unassigns a CUSTOMER-type assignment', async () => {
    renderList()
    await screen.findByText('Bob')

    fireEvent.click(
      within(rowFor('Bob')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('contacts.toasts.unassignSuccess')
      )
    )
    expect(api.deleteContactAssignment).toHaveBeenCalledWith('as-2')
    expect(api.deleteCustomer).not.toHaveBeenCalled()
  })

  it('shows the API error when a delete fails', async () => {
    api.deleteContactAssignment.mockRejectedValue({
      response: { data: { message: 'locked' } },
    })
    renderList()
    await screen.findByText('Ann')

    fireEvent.click(
      within(rowFor('Ann')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('contacts.toasts.errorDelete'),
        'locked'
      )
    )
    expect(api.deleteCustomer).not.toHaveBeenCalled()
  })

  it('opens the contact or customer assignment edit page by user type', async () => {
    renderList()
    await screen.findByText('Ann')

    fireEvent.click(within(rowFor('Ann')).getByRole('button', { name: 'Edit' }))
    expect(screen.getByTestId('location').textContent).toBe(
      '/C-1/assignments/contact/as-1'
    )
    fireEvent.click(within(rowFor('Bob')).getByRole('button', { name: 'Edit' }))
    expect(screen.getByTestId('location').textContent).toBe(
      '/C-1/assignments/customer/as-2'
    )
  })

  it('batch deletes the selected assignments', async () => {
    renderList()
    await screen.findByText('Ann')
    fireEvent.click(within(rowFor('Ann')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Bob')).getByRole('checkbox'))
    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('contacts.toasts.deleteSuccess')
      )
    )
    expect(api.deleteContactAssignment).toHaveBeenCalledWith('as-1')
    expect(api.deleteContactAssignment).toHaveBeenCalledWith('as-2')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
  })

  it('disables row and batch actions without manager permissions', async () => {
    renderList(false)
    await screen.findByText('Ann')

    expect(
      (
        within(rowFor('Ann')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })
})
