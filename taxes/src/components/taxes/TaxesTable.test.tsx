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
  deleteTaxCall,
  getTaxCall,
  listCountriesCall,
  listTaxesCall,
  updateTaxCall,
} from '@emporix/api-calls/next'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { renderAt } from '../../test/renderWithRouter'
import TaxesPage from '../../pages/Taxes.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls/next', () => ({
  listTaxesCall: vi.fn(),
  getTaxCall: vi.fn(),
  createTaxCall: vi.fn(),
  updateTaxCall: vi.fn(),
  deleteTaxCall: vi.fn(),
  listCountriesCall: vi.fn(),
  fetchAll: vi.fn(
    async (
      list: (p: unknown, o: unknown) => Promise<{ values: unknown[] }>,
      params: unknown,
      options: unknown
    ) => (await list(params, options)).values
  ),
}))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }, { id: 'de' }] }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const countries = [
  { code: 'DE', name: { en: 'Germany', de: 'Deutschland' }, active: true },
  { code: 'PL', name: { en: 'Poland', de: 'Polen' }, active: true },
  { code: 'FR', name: { en: 'France' }, active: false },
]

const germany = {
  locationCode: 'DE',
  location: { countryCode: 'DE' },
  taxClasses: [
    { code: 'STANDARD', name: { en: 'Standard rate' }, rate: 19, order: 1 },
    { code: 'REDUCED', name: { en: 'Reduced rate' }, rate: 7, order: 2 },
  ],
  metadata: { version: 3 },
}
const poland = {
  locationCode: 'PL',
  location: { countryCode: 'PL' },
  taxClasses: [{ code: 'VAT', name: { en: 'Polish VAT' }, rate: 23 }],
  metadata: { version: 1 },
}
// FR is not active in the tenant any more but still has a tax record.
const france = {
  locationCode: 'FR',
  location: { countryCode: 'FR' },
  taxClasses: [{ code: 'TVA', name: { en: 'French TVA' }, rate: 20 }],
  metadata: { version: 2 },
}

const renderList = (tenant = 'tenant-a') =>
  renderAt('/', { list: <TaxesPage />, detail: <div>detail</div> }, tenant)

const table = () => screen.getByTestId('taxes-table')

const rowFor = (text: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(text))
  if (!row) throw new Error(`no row for ${text}`)
  return row
}

const expand = (country: string) => {
  const toggler = rowFor(country).querySelector('button.p-row-toggler')
  if (!toggler) throw new Error('no row toggler')
  fireEvent.click(toggler)
}

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const confirmDialog = () => screen.getByRole('dialog')
const confirm = () =>
  fireEvent.click(within(confirmDialog()).getByRole('button', { name: 'Yes' }))

const lastQuery = () =>
  vi.mocked(listTaxesCall).mock.calls.at(-1)?.[0] as {
    pageNumber?: number
    pageSize?: number
    countryCode?: string
    sort?: string
  }

describe('Taxes list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.TAXES_VIEWER,
      EmployeeDomains.TAXES_MANAGER,
    ]
    vi.mocked(listCountriesCall).mockResolvedValue({
      values: countries as never,
      totalRecords: countries.length,
    })
    vi.mocked(listTaxesCall).mockResolvedValue({
      values: [germany, poland, france] as never,
      totalRecords: 23,
    })
    vi.mocked(getTaxCall).mockImplementation((async (code: string) =>
      [germany, poland, france].find((t) => t.locationCode === code)) as never)
    vi.mocked(deleteTaxCall).mockResolvedValue()
    vi.mocked(updateTaxCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Scenario 1: list', () => {
    it('shows a row per country record with its code and localized name', async () => {
      renderList()

      expect(await screen.findByText('Germany')).toBeTruthy()
      expect(screen.getByText('Poland')).toBeTruthy()
      expect(within(rowFor('Germany')).getByText('DE')).toBeTruthy()
      expect(listTaxesCall).toHaveBeenCalledWith(
        expect.objectContaining({ pageNumber: 1, pageSize: 10 }),
        { tenant: 'tenant-a' }
      )
    })

    it('marks a country that is not active', async () => {
      renderList()
      await screen.findByText('Germany')

      expect(screen.getByText('FR - Inactive')).toBeTruthy()
    })

    it('keeps add, row delete and batch delete disabled for a viewer', async () => {
      permissions.granted = [EmployeeDomains.TAXES_VIEWER]
      renderList()
      await screen.findByText('Germany')

      expect(
        (screen.getByTestId('taxes-create') as HTMLButtonElement).disabled
      ).toBe(true)
      expect(
        (
          within(rowFor('Germany')).getByRole('button', {
            name: 'Delete',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
      expect(batchDeleteButton().disabled).toBe(true)
    })

    it('opens the add page from the add button', async () => {
      renderList()
      await screen.findByText('Germany')
      fireEvent.click(screen.getByTestId('taxes-create'))

      expect(screen.getByTestId('location').textContent).toBe('/add')
    })
  })

  describe('Scenario 2: expand a country', () => {
    it('lists the tax classes with code, name and rate', async () => {
      renderList()
      await screen.findByText('Germany')

      expand('Germany')

      const classes = await screen.findByTestId('tax-classes-DE')
      expect(within(classes).getByText('STANDARD')).toBeTruthy()
      expect(within(classes).getByText('Standard rate')).toBeTruthy()
      expect(within(classes).getByText('19 %')).toBeTruthy()
      expect(within(classes).getByText('REDUCED')).toBeTruthy()
      expect(within(classes).getByText('7 %')).toBeTruthy()
    })

    it('shows no filter row in the tax classes table', async () => {
      renderList()
      await screen.findByText('Germany')

      expand('Germany')

      const classes = await screen.findByTestId('tax-classes-DE')
      expect(within(classes).queryAllByRole('textbox')).toHaveLength(0)
      expect(classes.querySelector('.p-filter-column')).toBeNull()
    })

    it('opens a class for editing from its edit action', async () => {
      renderList()
      await screen.findByText('Germany')
      expand('Germany')
      const classes = await screen.findByTestId('tax-classes-DE')

      const row = within(classes)
        .getAllByRole('row')
        .find((r) => within(r).queryByText('REDUCED'))
      if (!row) throw new Error('no class row')
      fireEvent.click(within(row).getByRole('button', { name: 'Edit' }))

      expect(screen.getByTestId('location').textContent).toBe('/DE/REDUCED')
    })
  })

  describe('Scenario 3: filter and sort', () => {
    it('reloads from the server with the chosen country code', async () => {
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(screen.getByTestId('taxes-country-filter-control'))
      fireEvent.mouseDown(await screen.findByText('PL - Poland'))

      await waitFor(() => expect(lastQuery().countryCode).toBe('PL'))
      expect(lastQuery().pageNumber).toBe(1)
    })

    it('reloads from the server sorted by country code', async () => {
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(screen.getByText('Country code'))
      await waitFor(() => expect(lastQuery().sort).toBe('countryCode:ASC'))

      fireEvent.click(screen.getByText('Country code'))
      await waitFor(() => expect(lastQuery().sort).toBe('countryCode:DESC'))
    })

    it('loads the requested page', async () => {
      renderList()
      await screen.findByText('Germany')

      const next = document.querySelector('.p-paginator-next')
      if (!next) throw new Error('no next-page button')
      fireEvent.click(next)

      await waitFor(() => expect(lastQuery().pageNumber).toBe(2))
    })
  })

  describe('Scenario 10: delete a class', () => {
    it('removes the class from the record and reloads the list', async () => {
      renderList()
      await screen.findByText('Germany')
      expand('Germany')
      const classes = await screen.findByTestId('tax-classes-DE')
      const row = within(classes)
        .getAllByRole('row')
        .find((r) => within(r).queryByText('REDUCED'))
      if (!row) throw new Error('no class row')

      fireEvent.click(within(row).getByRole('button', { name: 'Delete' }))
      confirm()

      await waitFor(() => expect(updateTaxCall).toHaveBeenCalledTimes(1))
      expect(updateTaxCall).toHaveBeenCalledWith(
        'DE',
        {
          location: { countryCode: 'DE' },
          taxClasses: [germany.taxClasses[0]],
          metadata: { version: 3 },
        },
        { tenant: 'tenant-a' }
      )
      expect(deleteTaxCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).toHaveBeenCalledWith('Tax was deleted')
      await waitFor(() => expect(listTaxesCall).toHaveBeenCalledTimes(2))
    })

    it('deletes the country record when its last class is deleted', async () => {
      renderList()
      await screen.findByText('Poland')
      expand('Poland')
      const classes = await screen.findByTestId('tax-classes-PL')

      fireEvent.click(within(classes).getByRole('button', { name: 'Delete' }))
      confirm()

      await waitFor(() =>
        expect(deleteTaxCall).toHaveBeenCalledWith('PL', {
          tenant: 'tenant-a',
        })
      )
      expect(updateTaxCall).not.toHaveBeenCalled()
    })

    it('keeps a viewer from deleting a class', async () => {
      permissions.granted = [EmployeeDomains.TAXES_VIEWER]
      renderList()
      await screen.findByText('Poland')
      expand('Poland')
      const classes = await screen.findByTestId('tax-classes-PL')

      expect(
        (
          within(classes).getByRole('button', {
            name: 'Delete',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
    })
  })

  describe('Scenario 11: delete countries', () => {
    it('deletes one country after confirmation, with a toast, and reloads', async () => {
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(
        within(rowFor('Germany')).getByRole('button', { name: 'Delete' })
      )
      confirm()

      await waitFor(() =>
        expect(deleteTaxCall).toHaveBeenCalledWith('DE', {
          tenant: 'tenant-a',
        })
      )
      expect(toast.showSuccess).toHaveBeenCalledWith('Tax was deleted')
      await waitFor(() => expect(listTaxesCall).toHaveBeenCalledTimes(2))
    })

    it('deletes nothing when the confirmation is cancelled', async () => {
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(
        within(rowFor('Germany')).getByRole('button', { name: 'Delete' })
      )
      fireEvent.click(
        within(confirmDialog()).getByRole('button', { name: 'Cancel' })
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(deleteTaxCall).not.toHaveBeenCalled()
    })

    it('batch deletes the selected countries, one toast each, and reloads the list from the server', async () => {
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(within(rowFor('Germany')).getByRole('checkbox'))
      fireEvent.click(within(rowFor('Poland')).getByRole('checkbox'))
      expect(batchDeleteButton().textContent).toBe('Delete (2)')
      // The server no longer has them after the deletes.
      vi.mocked(listTaxesCall).mockResolvedValue({
        values: [france] as never,
        totalRecords: 1,
      })
      fireEvent.click(batchDeleteButton())
      confirm()

      await waitFor(() => expect(deleteTaxCall).toHaveBeenCalledTimes(2))
      expect(deleteTaxCall).toHaveBeenCalledWith('DE', { tenant: 'tenant-a' })
      expect(deleteTaxCall).toHaveBeenCalledWith('PL', { tenant: 'tenant-a' })
      await waitFor(() => expect(toast.showSuccess).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(listTaxesCall).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(screen.queryByText('Germany')).toBeNull())
      expect(screen.queryByText('Poland')).toBeNull()
      expect(batchDeleteButton().textContent).toBe('Delete')
    })

    it('drops the selection and the rows when the host switches tenant', async () => {
      const { switchTenant } = renderList('tenant-a')
      await screen.findByText('Germany')
      fireEvent.click(within(rowFor('Germany')).getByRole('checkbox'))
      expect(batchDeleteButton().textContent).toBe('Delete (1)')

      vi.mocked(listTaxesCall).mockReturnValue(new Promise(() => {}))
      switchTenant('tenant-b')

      await waitFor(() =>
        expect(batchDeleteButton().textContent).toBe('Delete')
      )
      expect(screen.queryByText('Germany')).toBeNull()
      expect(listTaxesCall).toHaveBeenLastCalledWith(expect.anything(), {
        tenant: 'tenant-b',
      })
    })
  })

  describe('Scenario 12: failures are visible', () => {
    it('shows an error toast when the taxes cannot be loaded', async () => {
      vi.mocked(listTaxesCall).mockRejectedValue(new Error('boom'))
      renderList()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading taxes. Please try again later',
          undefined
        )
      )
    })

    it('shows an error toast when the countries cannot be loaded', async () => {
      vi.mocked(listCountriesCall).mockRejectedValue(new Error('boom'))
      renderList()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading countries. Please try again later',
          undefined
        )
      )
    })

    it('names the country in an error toast when its delete fails and keeps the list', async () => {
      vi.mocked(deleteTaxCall).mockRejectedValue(new Error('boom'))
      renderList()
      await screen.findByText('Germany')

      fireEvent.click(
        within(rowFor('Germany')).getByRole('button', { name: 'Delete' })
      )
      confirm()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while deleting DE',
          undefined
        )
      )
      expect(toast.showSuccess).not.toHaveBeenCalled()
      expect(screen.getByText('Germany')).toBeTruthy()
    })

    it('shows an error toast when a class delete fails', async () => {
      vi.mocked(updateTaxCall).mockRejectedValue(new Error('boom'))
      renderList()
      await screen.findByText('Germany')
      expand('Germany')
      const classes = await screen.findByTestId('tax-classes-DE')
      const row = within(classes)
        .getAllByRole('row')
        .find((r) => within(r).queryByText('REDUCED'))
      if (!row) throw new Error('no class row')

      fireEvent.click(within(row).getByRole('button', { name: 'Delete' }))
      confirm()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while deleting REDUCED',
          undefined
        )
      )
      expect(toast.showSuccess).not.toHaveBeenCalled()
    })
  })
})
