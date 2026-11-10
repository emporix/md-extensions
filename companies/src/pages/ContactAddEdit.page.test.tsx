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
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { ContactType } from '../models/LegalEntity.model'
import ContactAddEditPage from './ContactAddEdit.page'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../constants/currency'

const calls = vi.hoisted(() => [] as string[])
const tracked = vi.hoisted(
  () =>
    (name: string, impl: (...args: unknown[]) => unknown = () => undefined) =>
      vi.fn((...args: unknown[]) => {
        calls.push(name)
        return Promise.resolve(impl(...args))
      })
)
const management = vi.hoisted(() => ({
  getLegalEntity: vi.fn(),
  createContactWithAssignment: vi.fn(),
  addApprovalGroupContact: vi.fn(),
  getContactAssignment: vi.fn(),
  updateContactWithAssignment: vi.fn(),
}))
const customers = vi.hoisted(() => ({
  editCustomer: vi.fn(),
  createCustomer: vi.fn(),
  patchCustomer: vi.fn(),
  createCustomerAddress: vi.fn(),
  editCustomerAddress: vi.fn(),
  syncCustomer: vi.fn(),
}))
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
  useCustomerApi: () => customers,
}))
vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    activeCountriesDropdownOptions: [
      { label: 'DE - Germany', value: 'DE' },
      { label: 'PL - Poland', value: 'PL' },
    ],
  }),
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
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  )
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/:companyId/assignments/contact/:contactAssignmentId?"
          element={<ContactAddEditPage />}
        />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  )

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
})

const renderWithTenant = (path: string) => {
  const tree = (tenant: string) => (
    <DashboardProvider appState={appStateFor(tenant)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/:companyId/assignments/contact/:contactAssignmentId?"
            element={<ContactAddEditPage />}
          />
          <Route path="*" element={<div>elsewhere</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    </DashboardProvider>
  )
  const result = render(tree('tenant-a'))
  return { switchTenant: (next: string) => result.rerender(tree(next)) }
}

const currentPath = () => screen.getByTestId('location').textContent
const input = (id: string) => document.getElementById(id) as HTMLInputElement
const typeInto = (id: string, value: string) =>
  fireEvent.change(input(id), { target: { value } })
const button = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement
const pickOption = (testId: string, index: number) => {
  fireEvent.click(screen.getByTestId(`${testId}-control`))
  fireEvent.mouseDown(screen.getByTestId(`${testId}-option-${index}`))
}

const company = {
  id: 'c1',
  name: 'Acme',
  restrictions: ['restriction-a', 'restriction-b'],
  approvalGroup: [{ id: 'existing' }],
}

const assignment = {
  id: 'as-1',
  type: ContactType.BILLING,
  primary: false,
  legalEntity: { id: 'c1' },
  customer: { id: 'cust-1' },
  metadata: { version: 4 },
}

const customer = {
  id: 'cust-1',
  firstName: 'Ann',
  lastName: 'Lee',
  contactEmail: 'ann@example.com',
  contactPhone: '',
  title: 'MS',
  type: 'CONTACT',
  addresses: [{ id: 'addr-1', street: 'Main', country: 'DE', zipCode: '1' }],
}

const fillNewContact = () => {
  typeInto('contact-firstName', 'Ann')
  typeInto('contact-lastName', 'Lee')
  typeInto('contact-contactEmail', 'ann@example.com')
  typeInto('contact-street', 'Main')
  pickOption('country', 1)
}

describe('Contact add / edit', () => {
  const originalLocation = window.location
  const assign = vi.fn()

  beforeEach(async () => {
    await i18n.changeLanguage('en')
    calls.length = 0
    permissions.granted = [
      EmployeeDomains.COMPANIES_MANAGER,
      EmployeeDomains.CUSTOMERS_MANAGER,
    ]
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    })
    management.getLegalEntity.mockResolvedValue(company)
    management.getContactAssignment.mockImplementation(
      tracked('getContactAssignment', () => assignment)
    )
    management.createContactWithAssignment.mockImplementation(
      tracked('createContactWithAssignment', () => 'as-new')
    )
    management.addApprovalGroupContact.mockImplementation(
      tracked('addApprovalGroupContact')
    )
    management.updateContactWithAssignment.mockImplementation(
      tracked('updateContactWithAssignment')
    )
    customers.createCustomer.mockImplementation(
      tracked('createCustomer', () => ({ id: 'cust-new', link: '' }))
    )
    customers.createCustomerAddress.mockImplementation(
      tracked('createCustomerAddress')
    )
    customers.syncCustomer.mockImplementation(
      tracked('syncCustomer', () => customer)
    )
    customers.editCustomer.mockImplementation(tracked('editCustomer'))
    customers.editCustomerAddress.mockImplementation(
      tracked('editCustomerAddress')
    )
    customers.patchCustomer.mockImplementation(tracked('patchCustomer'))
  })

  afterEach(() => {
    cleanup()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    vi.clearAllMocks()
    for (const fn of [
      ...Object.values(management),
      ...Object.values(customers),
    ]) {
      fn.mockReset()
    }
  })

  // Scenario 12
  it('returns to the list when the host switches tenant', async () => {
    const { switchTenant } = renderWithTenant('/c1/assignments/contact/as-1')
    await waitFor(() => expect(management.getLegalEntity).toHaveBeenCalled())

    switchTenant('tenant-b')

    await waitFor(() => expect(currentPath()).toBe('/'))
  })

  it('creates customer, address, assignment and approval entry in order', async () => {
    renderAt('/c1/assignments/contact?approval=true&primary=true')
    await waitFor(() =>
      expect(screen.getByTestId('legalEntity').textContent).toBe('Acme')
    )
    // ?primary=true presets the switch
    expect(
      (screen.getByTestId('primary-input') as HTMLInputElement).checked
    ).toBe(true)

    fillNewContact()
    await waitFor(() => expect(button('contact-save').disabled).toBe(false))
    fireEvent.click(button('contact-save'))

    await waitFor(() =>
      expect(currentPath()).toBe('/c1/assignments/contact/as-new')
    )
    // ...then the edit page loads the new assignment.
    expect(calls.slice(0, 4)).toEqual([
      'createCustomer',
      'createCustomerAddress',
      'createContactWithAssignment',
      'addApprovalGroupContact',
    ])
    expect(customers.createCustomer.mock.calls[0][0]).toMatchObject({
      type: 'CONTACT',
      businessModel: 'B2B',
      firstName: 'Ann',
      lastName: 'Lee',
      contactEmail: 'ann@example.com',
      title: 'MR',
      restriction: 'restriction-a',
    })
    expect(customers.createCustomerAddress).toHaveBeenCalledWith(
      'cust-new',
      expect.objectContaining({
        contactName: 'Ann Lee',
        street: 'Main',
        country: 'PL',
      })
    )
    expect(management.createContactWithAssignment.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: ContactType.CONTACT,
        primary: true,
        legalEntity: company,
        customer: {
          id: 'cust-new',
          name: 'Ann',
          surname: 'Lee',
          email: 'ann@example.com',
          phone: '',
        },
      })
    )
    expect(management.addApprovalGroupContact).toHaveBeenCalledWith(company, [
      { id: 'as-new' },
    ])
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.any(String),
      '',
      'success'
    )
  })

  it('does not touch the approval group without ?approval=true', async () => {
    renderAt('/c1/assignments/contact')
    await waitFor(() =>
      expect(screen.getByTestId('legalEntity').textContent).toBe('Acme')
    )
    expect(
      (screen.getByTestId('primary-input') as HTMLInputElement).checked
    ).toBe(false)
    fillNewContact()
    await waitFor(() => expect(button('contact-save').disabled).toBe(false))
    fireEvent.click(button('contact-save'))

    await waitFor(() =>
      expect(currentPath()).toBe('/c1/assignments/contact/as-new')
    )
    expect(management.addApprovalGroupContact).not.toHaveBeenCalled()
  })

  it('keeps Save disabled until the required fields are filled', async () => {
    renderAt('/c1/assignments/contact')
    await waitFor(() =>
      expect(screen.getByTestId('legalEntity').textContent).toBe('Acme')
    )
    typeInto('contact-firstName', 'Ann')
    await waitFor(() => expect(button('contact-save')).toBeTruthy())
    expect(button('contact-save').disabled).toBe(true)
  })

  it('shows an error toast and stays when creating the customer fails', async () => {
    customers.createCustomer.mockRejectedValue({
      response: { data: { message: 'Email taken' } },
    })
    renderAt('/c1/assignments/contact')
    await waitFor(() =>
      expect(screen.getByTestId('legalEntity').textContent).toBe('Acme')
    )
    fillNewContact()
    await waitFor(() => expect(button('contact-save').disabled).toBe(false))
    fireEvent.click(button('contact-save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        expect.any(String),
        'Email taken'
      )
    )
    expect(customers.createCustomerAddress).not.toHaveBeenCalled()
    expect(management.createContactWithAssignment).not.toHaveBeenCalled()
    expect(currentPath()).toBe('/c1/assignments/contact')
  })

  it('edits assignment, then customer, then address', async () => {
    renderAt('/c1/assignments/contact/as-1')
    await waitFor(() => expect(input('contact-firstName').value).toBe('Ann'))
    expect(input('contact-id').readOnly).toBe(true)
    calls.length = 0

    typeInto('contact-lastName', 'Leeson')
    await waitFor(() => expect(button('contact-save').disabled).toBe(false))
    fireEvent.click(button('contact-save'))

    await waitFor(() =>
      expect(calls).toEqual([
        'updateContactWithAssignment',
        'syncCustomer',
        'editCustomer',
        'editCustomerAddress',
        'getContactAssignment',
        'syncCustomer',
      ])
    )
    expect(management.updateContactWithAssignment.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: 'as-1',
        type: ContactType.BILLING,
        customer: expect.objectContaining({ id: 'cust-1', surname: 'Leeson' }),
      })
    )
    expect(customers.editCustomerAddress).toHaveBeenCalledWith(
      'cust-1',
      expect.objectContaining({ id: 'addr-1' })
    )
    expect(customers.createCustomer).not.toHaveBeenCalled()
  })

  // Scenario 13
  it('changes the contact type to customer and leaves for the host customer page', async () => {
    renderAt('/c1/assignments/contact/as-1')
    await waitFor(() => expect(input('contact-firstName').value).toBe('Ann'))

    fireEvent.click(button('contact-convert'))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('/apps/management/customers/cust-1')
    )
    expect(customers.patchCustomer).toHaveBeenCalledWith({
      id: 'cust-1',
      type: 'CUSTOMER',
    })
    expect(calls.indexOf('patchCustomer')).toBeLessThan(
      calls.lastIndexOf('updateContactWithAssignment')
    )
  })

  it('shows an error toast when changing the type fails', async () => {
    customers.patchCustomer.mockRejectedValue({
      response: { data: { details: 'Not allowed' } },
    })
    renderAt('/c1/assignments/contact/as-1')
    await waitFor(() => expect(input('contact-firstName').value).toBe('Ann'))

    fireEvent.click(button('contact-convert'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        expect.any(String),
        'Not allowed'
      )
    )
    expect(assign).not.toHaveBeenCalled()
  })

  // Scenario 3
  it('is read-only without Customers Manager', async () => {
    permissions.granted = [EmployeeDomains.COMPANIES_MANAGER]
    renderAt('/c1/assignments/contact/as-1')
    await waitFor(() => expect(input('contact-firstName').value).toBe('Ann'))

    for (const id of [
      'contact-firstName',
      'contact-lastName',
      'contact-contactEmail',
      'contact-street',
      'contact-zipCode',
    ]) {
      expect(input(id).readOnly).toBe(true)
    }
    expect(
      (screen.getByTestId('primary-input') as HTMLInputElement).disabled
    ).toBe(true)
    expect(button('contact-save').disabled).toBe(true)
    expect(button('contact-convert').disabled).toBe(true)
  })
})
