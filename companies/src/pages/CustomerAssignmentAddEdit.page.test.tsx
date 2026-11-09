/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { HashRouter, Route, Routes, useLocation } from 'react-router'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { ContactType } from '../models/LegalEntity.model'
import { NavigationConfirmProvider } from '../context/NavigationConfirmProvider'
import CustomerAssignmentAddEditPage from './CustomerAssignmentAddEdit.page'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'

const management = vi.hoisted(() => ({
  getContactAssignment: vi.fn(),
  getLegalEntity: vi.fn(),
  updateContactWithAssignment: vi.fn(),
  createContactWithAssignment: vi.fn(),
  addApprovalGroupContact: vi.fn(),
  deleteContactAssignment: vi.fn(),
  getContactsForEntity: vi.fn(),
}))
const customersApi = vi.hoisted(() => ({ syncCustomers: vi.fn() }))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => management,
}))
vi.mock('../hooks/api/customers', () => ({
  useCustomerApi: () => customersApi,
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

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <>
      <div data-testid="pathname">{location.pathname}</div>
      <div data-testid="search">{location.search}</div>
    </>
  )
}

// A real HashRouter: the remote's pagination and tab hooks read the live
// `window.location.hash`, as they do inside the host.
const renderAt = (path: string) => {
  window.history.replaceState(null, '', `/#${path}`)
  return render(
    <HashRouter>
      <NavigationConfirmProvider>
        <Routes>
          <Route
            path="/:companyId/assignments/customer/:contactAssignmentId?"
            element={<CustomerAssignmentAddEditPage />}
          />
          <Route path="*" element={<div>elsewhere</div>} />
        </Routes>
        <LocationDisplay />
      </NavigationConfirmProvider>
    </HashRouter>
  )
}

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

const renderWithTenant = (path: string) => {
  window.history.replaceState(null, '', `/#${path}`)
  const tree = (tenant: string) => (
    <DashboardProvider appState={appStateFor(tenant)}>
      <HashRouter>
        <NavigationConfirmProvider>
          <Routes>
            <Route
              path="/:companyId/assignments/customer/:contactAssignmentId?"
              element={<CustomerAssignmentAddEditPage />}
            />
            <Route path="*" element={<div>elsewhere</div>} />
          </Routes>
          <LocationDisplay />
        </NavigationConfirmProvider>
      </HashRouter>
    </DashboardProvider>
  )
  const result = render(tree('tenant-a'))
  return { switchTenant: (next: string) => result.rerender(tree(next)) }
}

const pathname = () => screen.getByTestId('pathname').textContent
const search = () =>
  new URLSearchParams(screen.getByTestId('search').textContent ?? '')
const button = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement
const radio = (customerId: string) =>
  screen.getByTestId(`customer-select-${customerId}-input`) as HTMLInputElement

const company = { id: 'c1', name: 'Acme', approvalGroup: [] }
const customers = [
  {
    id: 'cust-1',
    firstName: 'Ann',
    lastName: 'Lee',
    contactEmail: 'ann@example.com',
    contactPhone: '123',
    type: 'CUSTOMER',
  },
  {
    id: 'cust-2',
    firstName: 'Bob',
    lastName: 'Ray',
    contactEmail: 'bob@example.com',
    contactPhone: '',
    type: 'CUSTOMER',
  },
]
const assignment = {
  id: 'as-1',
  type: ContactType.LOGISTICS,
  primary: true,
  legalEntity: { id: 'c1' },
  customer: { id: 'cust-1', name: 'Ann', surname: 'Lee' },
}

const waitForTable = () =>
  waitFor(() => expect(screen.getByText('ann@example.com')).toBeTruthy())

describe('Customer assignment add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.COMPANIES_MANAGER,
      EmployeeDomains.CUSTOMERS_VIEWER,
      EmployeeDomains.CUSTOMERS_MANAGER,
    ]
    management.getLegalEntity.mockResolvedValue(company)
    management.getContactsForEntity.mockResolvedValue([
      { id: 'as-other', customer: { id: 'cust-2' } },
    ])
    management.getContactAssignment.mockResolvedValue(assignment)
    management.createContactWithAssignment.mockResolvedValue('as-new')
    management.addApprovalGroupContact.mockResolvedValue(undefined)
    management.updateContactWithAssignment.mockResolvedValue(undefined)
    management.deleteContactAssignment.mockResolvedValue(undefined)
    customersApi.syncCustomers.mockImplementation(async () => ({
      values: customers.map((customer) => ({ ...customer })),
      totalRecords: 2,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    for (const fn of [
      ...Object.values(management),
      ...Object.values(customersApi),
    ]) {
      fn.mockReset()
    }
  })

  // Scenario 14
  it('returns to the list when the host switches tenant', async () => {
    const { switchTenant } = renderWithTenant('/c1/assignments/customer/as-1')
    await waitFor(() =>
      expect(management.getContactAssignment).toHaveBeenCalledWith('as-1')
    )

    switchTenant('tenant-b')

    await waitFor(() => expect(pathname()).toBe('/'))
  })

  it('reloads when the route switches to another assignment', async () => {
    renderAt('/c1/assignments/customer/as-1')
    await waitFor(() =>
      expect(management.getContactAssignment).toHaveBeenCalledWith('as-1')
    )

    act(() => {
      window.location.hash = '#/c1/assignments/customer/as-2'
    })

    await waitFor(() =>
      expect(management.getContactAssignment).toHaveBeenCalledWith('as-2')
    )
  })

  it('loads 10 customers and marks the ones already assigned', async () => {
    renderAt('/c1/assignments/customer')
    await waitForTable()

    expect(customersApi.syncCustomers.mock.calls[0][0]).toMatchObject({
      rows: 10,
      first: 0,
    })
    expect(screen.getByTestId('customer-assigned-cust-2')).toBeTruthy()
    expect(screen.queryByTestId('customer-select-cust-2')).toBeNull()
    expect(radio('cust-1').checked).toBe(false)
    expect(screen.getByTestId('legalEntity').textContent).toBe('Acme')
  })

  it('assigns the selected customer and opens the new assignment', async () => {
    renderAt('/c1/assignments/customer')
    await waitForTable()
    expect(button('assignment-save').disabled).toBe(true)

    fireEvent.click(radio('cust-1'))
    await waitFor(() => expect(button('assignment-save').disabled).toBe(false))
    expect(button('assignment-save').textContent).toBe('Save')
    fireEvent.click(button('assignment-save'))

    await waitFor(() =>
      expect(management.createContactWithAssignment).toHaveBeenCalledTimes(1)
    )
    expect(management.createContactWithAssignment.mock.calls[0][0]).toEqual({
      legalEntity: { id: 'c1' },
      type: ContactType.CONTACT,
      customer: {
        id: 'cust-1',
        name: 'Ann',
        surname: 'Lee',
        email: 'ann@example.com',
        phone: '123',
        type: 'CUSTOMER',
      },
    })
    await waitFor(() =>
      expect(pathname()).toBe('/c1/assignments/customer/as-new')
    )
    await waitFor(() =>
      expect(management.getContactAssignment).toHaveBeenCalledWith('as-new')
    )
    expect(management.addApprovalGroupContact).not.toHaveBeenCalled()
  })

  it('with ?approval=true adds the assignment to the approval group', async () => {
    renderAt('/c1/assignments/customer?approval=true')
    await waitForTable()

    fireEvent.click(radio('cust-1'))
    await waitFor(() => expect(button('assignment-save').disabled).toBe(false))
    expect(button('assignment-save').textContent).toBe(
      'Save as approval contact'
    )
    fireEvent.click(button('assignment-save'))

    await waitFor(() => expect(pathname()).toBe('/c1'))
    expect(search().get('tab')).toBe('policies')
    expect(management.addApprovalGroupContact).toHaveBeenCalledWith(company, [
      { id: 'as-new' },
    ])
  })

  it('shows an error toast when assigning fails', async () => {
    management.createContactWithAssignment.mockRejectedValue({
      response: { data: { details: 'Already assigned' } },
    })
    renderAt('/c1/assignments/customer')
    await waitForTable()
    fireEvent.click(radio('cust-1'))
    await waitFor(() => expect(button('assignment-save').disabled).toBe(false))
    fireEvent.click(button('assignment-save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        expect.any(String),
        'Already assigned'
      )
    )
    expect(pathname()).toBe('/c1/assignments/customer')
  })

  it('edits an assignment narrowed to its customer', async () => {
    renderAt('/c1/assignments/customer/as-1')
    await waitFor(() =>
      expect(customersApi.syncCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            id: { value: 'cust-1', matchMode: 'equals' },
          }),
        })
      )
    )
    await waitFor(() => expect(radio('cust-1').checked).toBe(true))
    expect(
      (document.getElementById('assignment-id') as HTMLInputElement).readOnly
    ).toBe(true)

    fireEvent.click(screen.getByTestId('primary-input'))
    await waitFor(() => expect(button('assignment-save').disabled).toBe(false))
    fireEvent.click(button('assignment-save'))

    await waitFor(() =>
      expect(management.updateContactWithAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'as-1', primary: false })
      )
    )
  })

  it('Delete unassigns directly, without the confirm box (MD parity)', async () => {
    renderAt('/c1/assignments/customer/as-1')
    await waitForTable()

    fireEvent.click(button('assignment-delete'))

    await waitFor(() =>
      expect(management.deleteContactAssignment).toHaveBeenCalledWith('as-1')
    )
    await waitFor(() => expect(pathname()).toBe('/c1'))
    expect(search().get('tab')).toBe('customers')
  })

  it('opens the new-contact form with a backTo to this page', async () => {
    renderAt('/c1/assignments/customer?approval=true')
    await waitForTable()

    fireEvent.click(button('assignment-add-contact'))

    await waitFor(() => expect(pathname()).toBe('/c1/assignments/contact'))
    const backTo = search().get('backTo') ?? ''
    expect(backTo.startsWith('/c1/assignments/customer?')).toBe(true)
    expect(backTo).toContain('approval=true')
  })

  // Scenario 3
  it('is read-only without Companies Manager', async () => {
    permissions.granted = [EmployeeDomains.CUSTOMERS_VIEWER]
    renderAt('/c1/assignments/customer/as-1')
    await waitFor(() => expect(radio('cust-1').checked).toBe(true))

    expect(
      (document.getElementById('assignment-id') as HTMLInputElement).readOnly
    ).toBe(true)
    expect(
      (screen.getByTestId('primary-input') as HTMLInputElement).disabled
    ).toBe(true)
    expect(button('assignment-add-contact').disabled).toBe(true)
    expect(button('assignment-delete').disabled).toBe(true)
    expect(button('assignment-save').disabled).toBe(true)
  })
})
