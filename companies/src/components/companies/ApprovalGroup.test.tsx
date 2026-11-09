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
import { EmployeeDomains } from '../../configs/accessControls'
import { RefreshValuesProvider } from '../../context/RefreshValuesProvider'
import type { LegalEntity } from '../../models/LegalEntity.model'
import { ApprovalGroup } from './ApprovalGroup'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const api = vi.hoisted(() => ({
  getContactsForEntity: vi.fn(),
  deleteContactAssignment: vi.fn(),
  addApprovalGroupContact: vi.fn(),
  removeApprovalGroupContact: vi.fn(),
}))

vi.mock('../../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => api,
}))

vi.mock('../../hooks/api/customers', () => ({
  useCustomerApi: () => ({ deleteCustomer: vi.fn() }),
}))

vi.mock('../../context/PermissionsProvider', () => ({
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

const legalEntity = {
  id: 'C-1',
  name: 'Acme',
  approvalGroup: [
    {
      id: 'ap-1',
      customer: { name: 'Ann', surname: 'Approver', email: 'ann@x.io' },
    },
  ],
} as unknown as Partial<LegalEntity>

const assignment = {
  id: 'as-9',
  type: 'CONTACT',
  primary: false,
  legalEntity: { id: 'C-1' },
  customer: { id: 'cust-9', name: 'Zed', surname: 'New', type: 'CONTACT' },
}

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  )
}

const renderGroup = (managerPermissions = true) =>
  render(
    <MemoryRouter initialEntries={['/C-1']}>
      <RefreshValuesProvider>
        <Routes>
          <Route
            path="*"
            element={
              <ApprovalGroup
                legalEntity={legalEntity}
                managerPermissions={managerPermissions}
              />
            }
          />
        </Routes>
        <LocationDisplay />
      </RefreshValuesProvider>
    </MemoryRouter>
  )

const groupTable = () => screen.getByTestId('approval-group-table')

describe('ApprovalGroup', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.CUSTOMERS_MANAGER]
    api.getContactsForEntity.mockResolvedValue([assignment])
    api.addApprovalGroupContact.mockResolvedValue(undefined)
    api.removeApprovalGroupContact.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // S11
  it('lists the approval group contacts', () => {
    renderGroup()

    expect(within(groupTable()).getByText('Ann')).toBeTruthy()
    expect(within(groupTable()).getByText('Approver')).toBeTruthy()
    expect(within(groupTable()).getByText('ann@x.io')).toBeTruthy()
  })

  it('removes a contact from the approval group after confirmation', async () => {
    renderGroup()

    fireEvent.click(
      within(groupTable()).getByRole('button', { name: 'Delete' })
    )
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(i18n.t('companies.approvalGroup.delete.title'))
    ).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('companies.approvalGroup.toast.delete.success')
      )
    )
    expect(api.removeApprovalGroupContact).toHaveBeenCalledWith(legalEntity, [
      'ap-1',
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows the API error when the remove fails', async () => {
    api.removeApprovalGroupContact.mockRejectedValue({
      response: { data: { message: 'nope' } },
    })
    renderGroup()

    fireEvent.click(
      within(groupTable()).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('companies.toasts.errorDelete'),
        'nope'
      )
    )
  })

  it('adds an existing contact picked in the dialog', async () => {
    renderGroup()
    const addExisting = i18n.t('companies.approvalGroup.add.existing.label')

    fireEvent.click(screen.getByRole('button', { name: addExisting }))
    const dialog = await screen.findByTestId('approval-group-add-dialog')
    expect(
      within(dialog).getByText(
        i18n.t('companies.approvalGroup.add.dialogTitle')
      )
    ).toBeTruthy()
    expect(api.getContactsForEntity).toHaveBeenCalledWith('C-1')

    const row = (await within(dialog).findByText('Zed')).closest('tr')
    if (!row) throw new Error('no contact row')
    fireEvent.click(within(row).getByRole('checkbox'))
    fireEvent.click(within(dialog).getByRole('button', { name: addExisting }))

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('companies.approvalGroup.toast.add.success'),
        ''
      )
    )
    expect(api.addApprovalGroupContact).toHaveBeenCalledWith(legalEntity, [
      expect.objectContaining({ id: 'as-9' }),
    ])
  })

  it('opens the new contact page flagged as approval contact', async () => {
    renderGroup()

    fireEvent.click(screen.getByTestId('add-contact-split-button-menubutton'))
    fireEvent.click(
      await screen.findByText(i18n.t('companies.approvalGroup.add.new.label'))
    )

    expect(screen.getByTestId('location').textContent).toBe(
      '/C-1/assignments/contact?approval=true'
    )
  })

  it('disables add and remove without manager permissions', () => {
    renderGroup(false)

    expect(
      (
        screen.getByRole('button', {
          name: i18n.t('companies.approvalGroup.add.existing.label'),
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      (
        within(groupTable()).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })
})
