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
import { deleteSiteCall, listSitesCall } from '@emporix/api-calls/next'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import SitesListPage from './SitesList.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls/next', () => ({
  listSitesCall: vi.fn(),
  deleteSiteCall: vi.fn(),
  getSiteCall: vi.fn(),
  createSiteCall: vi.fn(),
  updateSiteCall: vi.fn(),
  patchSiteCall: vi.fn(),
  fetchAll: vi.fn(
    async (
      list: (p: unknown, o: unknown) => Promise<{ values: unknown[] }>,
      params: unknown,
      options: unknown
    ) => (await list(params, options)).values
  ),
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

const sites = [
  {
    code: 'main',
    name: 'Main shop',
    default: true,
    active: true,
    languages: ['en', 'de'],
    currency: 'EUR',
    shipToCountries: ['DE', 'AT'],
  },
  {
    code: 'pl',
    name: 'Polish shop',
    active: true,
    languages: ['pl'],
    currency: 'PLN',
    shipToCountries: ['PL'],
  },
  {
    code: 'old',
    name: 'Retired shop',
    active: false,
    languages: ['en'],
    currency: 'USD',
    shipToCountries: ['US'],
  },
]

const MANAGER = [EmployeeDomains.SITES_VIEWER, EmployeeDomains.SITES_MANAGER]

const onSitesChanged = vi.fn()

const renderList = () =>
  renderAt(
    '/',
    { list: <SitesListPage />, detail: <div>detail</div> },
    'tenant-a',
    { onSitesChanged }
  )

const tableRows = () =>
  within(screen.getByTestId('sites-table'))
    .getAllByRole('row')
    .filter((row) => within(row).queryByText(/Main shop|Polish|Retired/))

const rowFor = (name: string) => {
  const row = tableRows().find((r) => within(r).queryByText(name))
  if (!row) throw new Error(`no row for ${name}`)
  return row
}

const confirmDialog = () => screen.getByRole('dialog')

const batchDeleteButton = () => {
  const table = screen.getByTestId('sites-table')
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table.contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const deleteRow = async (name: string) => {
  fireEvent.click(within(rowFor(name)).getByRole('button', { name: 'Delete' }))
  fireEvent.click(within(confirmDialog()).getByRole('button', { name: 'Yes' }))
}

describe('Sites list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [...MANAGER]
    vi.mocked(listSitesCall).mockResolvedValue({
      values: sites as never,
      totalRecords: sites.length,
    })
    vi.mocked(deleteSiteCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Scenario 1: list', () => {
    it('shows code (with the default marker), name, languages, currency, ship to and active', async () => {
      renderList()

      expect(await screen.findByText('main (default)')).toBeTruthy()
      for (const header of [
        'Code',
        'Name',
        'Languages',
        'Currency',
        'Ship to',
        'Active',
      ]) {
        expect(screen.getAllByText(header).length).toBeGreaterThan(0)
      }
      const main = rowFor('Main shop')
      expect(within(main).getByText('EN')).toBeTruthy()
      expect(within(main).getAllByText('DE')).toHaveLength(2)
      expect(within(main).getByText('AT')).toBeTruthy()
      expect(within(main).getByText('EUR')).toBeTruthy()
      expect(within(main).getByLabelText('Active')).toBeTruthy()
      expect(
        within(rowFor('Retired shop')).getByLabelText('Inactive')
      ).toBeTruthy()
    })

    it('asks for inactive sites only for a Sites Manager', async () => {
      renderList()
      await screen.findByText('Main shop')
      expect(vi.mocked(listSitesCall).mock.calls[0][0]).toEqual({
        includeInactive: true,
      })
      expect(vi.mocked(listSitesCall).mock.calls[0][1]).toEqual({
        tenant: 'tenant-a',
      })

      cleanup()
      vi.mocked(listSitesCall).mockClear()
      permissions.granted = [EmployeeDomains.SITES_VIEWER]
      renderList()
      await screen.findByText('Main shop')
      expect(vi.mocked(listSitesCall).mock.calls[0][0]).toEqual({
        includeInactive: false,
      })
    })

    it('narrows rows by the name filter', async () => {
      renderList()
      await screen.findByText('Main shop')

      fireEvent.change(screen.getByPlaceholderText('Filter by name'), {
        target: { value: 'Pol' },
      })

      await waitFor(() => expect(screen.queryByText('Main shop')).toBeNull())
      expect(screen.getByText('Polish shop')).toBeTruthy()
    })

    it('sorts rows by name when the header is clicked', async () => {
      renderList()
      await screen.findByText('Main shop')

      fireEvent.click(screen.getByText('Name'))

      await waitFor(() =>
        expect(
          tableRows().map((row) => within(row).queryByText(/shop/)?.textContent)
        ).toEqual(['Main shop', 'Polish shop', 'Retired shop'])
      )
    })

    it('opens a site on row click', async () => {
      renderList()
      fireEvent.click(await screen.findByText('Polish shop'))
      expect(screen.getByTestId('location').textContent).toBe('/pl')
    })

    it('opens the create page from the create button', async () => {
      renderList()
      await screen.findByText('Main shop')
      fireEvent.click(screen.getByTestId('sites-create'))
      expect(screen.getByTestId('location').textContent).toBe('/add')
    })
  })

  describe('Scenario 2: viewer is read-only', () => {
    it('keeps create, row delete and batch delete disabled', async () => {
      permissions.granted = [EmployeeDomains.SITES_VIEWER]
      renderList()
      await screen.findByText('Polish shop')

      expect(
        (screen.getByTestId('sites-create') as HTMLButtonElement).disabled
      ).toBe(true)
      expect(
        (
          within(rowFor('Polish shop')).getByRole('button', {
            name: 'Delete',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
      expect(batchDeleteButton().disabled).toBe(true)
    })
  })

  describe('Scenario 5: delete', () => {
    it('deletes a site after confirmation, reloads and tells the host', async () => {
      renderList()
      await screen.findByText('Polish shop')

      await deleteRow('Polish shop')

      await waitFor(() =>
        expect(deleteSiteCall).toHaveBeenCalledWith('pl', {
          tenant: 'tenant-a',
        })
      )
      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith(
          'Site Polish shop deleted'
        )
      )
      await waitFor(() => expect(listSitesCall).toHaveBeenCalledTimes(2))
      expect(onSitesChanged).toHaveBeenCalledTimes(1)
    })

    it('batch deletes the selection one after another with a toast each', async () => {
      renderList()
      await screen.findByText('Polish shop')

      fireEvent.click(within(rowFor('Polish shop')).getByRole('checkbox'))
      fireEvent.click(within(rowFor('Retired shop')).getByRole('checkbox'))
      expect(batchDeleteButton().textContent).toBe('Delete (2)')
      fireEvent.click(batchDeleteButton())
      fireEvent.click(
        within(confirmDialog()).getByRole('button', { name: 'Yes' })
      )

      await waitFor(() => expect(deleteSiteCall).toHaveBeenCalledTimes(2))
      expect(vi.mocked(deleteSiteCall).mock.calls.map((c) => c[0])).toEqual([
        'pl',
        'old',
      ])
      expect(toast.showSuccess).toHaveBeenCalledTimes(2)
      await waitFor(() =>
        expect(batchDeleteButton().textContent).toBe('Delete')
      )
      expect(onSitesChanged).toHaveBeenCalledTimes(1)
    })

    it('does not tell the host when nothing was deleted', async () => {
      vi.mocked(deleteSiteCall).mockRejectedValue(new Error('boom'))
      renderList()
      await screen.findByText('Polish shop')

      await deleteRow('Polish shop')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while deleting site',
          undefined
        )
      )
      expect(onSitesChanged).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 6: default site cannot be deleted', () => {
    it('refuses the default site, keeps it and leaves the page usable', async () => {
      renderList()
      await screen.findByText('Main shop')

      fireEvent.click(within(rowFor('Main shop')).getByRole('checkbox'))
      fireEvent.click(batchDeleteButton())
      fireEvent.click(
        within(confirmDialog()).getByRole('button', { name: 'Yes' })
      )

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Default site cannot be deleted'
        )
      )
      expect(deleteSiteCall).not.toHaveBeenCalled()
      await waitFor(() =>
        expect(batchDeleteButton().textContent).toBe('Delete')
      )
      expect(screen.getByText('Main shop')).toBeTruthy()
      expect(onSitesChanged).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 11: load errors', () => {
    it('shows an error toast and an empty list when the sites do not load', async () => {
      vi.mocked(listSitesCall).mockRejectedValue(new Error('offline'))
      renderList()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading sites',
          undefined
        )
      )
      expect(screen.queryByText('Main shop')).toBeNull()
      expect(
        (screen.getByTestId('sites-create') as HTMLButtonElement).disabled
      ).toBe(false)
    })
  })
})
