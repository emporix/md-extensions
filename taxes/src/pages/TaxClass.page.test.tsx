/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createTaxCall,
  getTaxCall,
  listCountriesCall,
  listTaxesCall,
  updateTaxCall,
} from '@emporix/api-calls/next'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import TaxClassPage from './TaxClass.page'

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

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }, { id: 'de' }] }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const countries = [
  { code: 'DE', name: { en: 'Germany' }, active: true },
  { code: 'PL', name: { en: 'Poland' }, active: true },
]

const germany = {
  locationCode: 'DE',
  location: { countryCode: 'DE' },
  taxClasses: [
    {
      code: 'STANDARD',
      name: { en: 'Standard rate' },
      description: { en: 'The usual one' },
      rate: 19,
      order: 1,
      isDefault: true,
    },
    { code: 'REDUCED', name: { en: 'Reduced rate' }, rate: 7, order: 2 },
  ],
  metadata: { version: 3, createdAt: '2026-01-01' },
}

const notFound = () =>
  Object.assign(new Error('nf'), { response: { status: 404 } })

const renderDetail = (path: string, tenant = 'tenant-a') =>
  renderAt(path, { list: <div>list</div>, detail: <TaxClassPage /> }, tenant)

const inputIn = (testId: string) => {
  const element = screen.getByTestId(testId)
  const input =
    element instanceof HTMLInputElement
      ? element
      : element.querySelector('input, textarea')
  if (!input) throw new Error(`no input in ${testId}`)
  return input as HTMLInputElement
}
const saveButton = () =>
  screen.getByTestId('tax-class-save') as HTMLButtonElement
const discardButton = () =>
  screen.getByTestId('tax-class-discard') as HTMLButtonElement

const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })

const pickCountry = async (label: string) => {
  fireEvent.click(screen.getByTestId('tax-class-country-control'))
  fireEvent.mouseDown(await screen.findByText(label))
}

const save = async () => {
  await waitFor(() => expect(saveButton().disabled).toBe(false))
  fireEvent.click(saveButton())
}

const location = () => screen.getByTestId('location').textContent

describe('Tax class add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.TAXES_VIEWER,
      EmployeeDomains.TAXES_MANAGER,
    ]
    vi.mocked(listCountriesCall).mockResolvedValue({
      values: countries as never,
      totalRecords: 2,
    })
    vi.mocked(getTaxCall).mockResolvedValue(germany as never)
    vi.mocked(createTaxCall).mockResolvedValue({ locationCode: 'PL' })
    vi.mocked(updateTaxCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Scenario 4: add a class to a new country', () => {
    it('creates the record with the class, shows a success toast and opens the list', async () => {
      vi.mocked(getTaxCall).mockRejectedValue(notFound())
      renderDetail('/add')

      await pickCountry('PL - Poland')
      type(inputIn('tax-class-code'), 'vat')
      type(inputIn('tax-class-name'), 'Polish VAT')
      await save()

      await waitFor(() => expect(createTaxCall).toHaveBeenCalledTimes(1))
      expect(createTaxCall).toHaveBeenCalledWith(
        {
          location: { countryCode: 'PL' },
          taxClasses: [{ code: 'VAT', rate: 0, name: { en: 'Polish VAT' } }],
        },
        { tenant: 'tenant-a' }
      )
      expect(updateTaxCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).toHaveBeenCalledWith('Tax Class was added!')
      await waitFor(() => expect(location()).toBe('/'))
    })

    it('upper-cases the code as it is typed', async () => {
      renderDetail('/add')

      type(inputIn('tax-class-code'), 'reduced')

      expect(inputIn('tax-class-code').value).toBe('REDUCED')
    })

    it('keeps Discard and Save disabled until the form changes', async () => {
      renderDetail('/add')
      await waitFor(() => expect(listCountriesCall).toHaveBeenCalled())

      expect(saveButton().disabled).toBe(true)
      expect(discardButton().disabled).toBe(true)

      type(inputIn('tax-class-code'), 'a')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      expect(discardButton().disabled).toBe(false)

      fireEvent.click(discardButton())
      await waitFor(() => expect(inputIn('tax-class-code').value).toBe(''))
      expect(saveButton().disabled).toBe(true)
    })
  })

  describe('Scenario 5: add a class to an existing country', () => {
    it('looks the country up by code and appends the class to its record', async () => {
      renderDetail('/add')

      await pickCountry('DE - Germany')
      type(inputIn('tax-class-code'), 'super')
      await save()

      await waitFor(() => expect(updateTaxCall).toHaveBeenCalledTimes(1))
      expect(getTaxCall).toHaveBeenCalledWith('DE', { tenant: 'tenant-a' })
      expect(updateTaxCall).toHaveBeenCalledWith(
        'DE',
        {
          location: { countryCode: 'DE' },
          taxClasses: [
            ...germany.taxClasses,
            { code: 'SUPER', rate: 0, name: {} },
          ],
          metadata: { version: 3 },
        },
        { tenant: 'tenant-a' }
      )
      expect(createTaxCall).not.toHaveBeenCalled()
      // No scan over the first records of the list.
      expect(listTaxesCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).toHaveBeenCalledWith('Tax Class was added!')
      await waitFor(() => expect(location()).toBe('/'))
    })
  })

  describe('Scenario 6: add rejected without country or code', () => {
    it('sends nothing and marks the missing country and code', async () => {
      renderDetail('/add')

      type(inputIn('tax-class-name'), 'Something')
      await save()

      expect(await screen.findByText('Select a country')).toBeTruthy()
      expect(screen.getByText('Enter a tax code')).toBeTruthy()
      expect(getTaxCall).not.toHaveBeenCalled()
      expect(createTaxCall).not.toHaveBeenCalled()
      expect(updateTaxCall).not.toHaveBeenCalled()
      expect(location()).toBe('/add')
    })

    it('marks a code of blanks as missing', async () => {
      renderDetail('/add')

      await pickCountry('DE - Germany')
      type(inputIn('tax-class-code'), '   ')
      await save()

      expect(await screen.findByText('Enter a tax code')).toBeTruthy()
      expect(updateTaxCall).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 7: duplicate class code rejected', () => {
    it('sends nothing and marks the code when the country already has it', async () => {
      renderDetail('/add')

      await pickCountry('DE - Germany')
      type(inputIn('tax-class-code'), 'reduced')
      await save()

      expect(
        await screen.findByText(
          'This country already has a tax class with this code'
        )
      ).toBeTruthy()
      expect(updateTaxCall).not.toHaveBeenCalled()
      expect(createTaxCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).not.toHaveBeenCalled()
      expect(location()).toBe('/add')
    })

    it('does not take the same code in another country as a duplicate', async () => {
      vi.mocked(getTaxCall).mockRejectedValue(notFound())
      renderDetail('/add')

      await pickCountry('PL - Poland')
      type(inputIn('tax-class-code'), 'reduced')
      await save()

      await waitFor(() => expect(createTaxCall).toHaveBeenCalledTimes(1))
    })

    it('rejects a code another class of the country has when editing', async () => {
      renderDetail('/DE/REDUCED')
      await waitFor(() =>
        expect(inputIn('tax-class-code').value).toBe('REDUCED')
      )

      type(inputIn('tax-class-code'), 'standard')
      await save()

      expect(
        await screen.findByText(
          'This country already has a tax class with this code'
        )
      ).toBeTruthy()
      expect(updateTaxCall).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 8: edit a class', () => {
    it('loads the class and shows its values, with the country fixed', async () => {
      renderDetail('/DE/STANDARD')

      await waitFor(() =>
        expect(inputIn('tax-class-code').value).toBe('STANDARD')
      )
      expect(inputIn('tax-class-name').value).toBe('Standard rate')
      expect(inputIn('tax-class-description').value).toBe('The usual one')
      expect(inputIn('tax-class-rate').value).toContain('19')
      expect(screen.getByText('DE - Germany')).toBeTruthy()
      expect(
        screen
          .getByTestId('tax-class-country-control')
          .getAttribute('aria-disabled')
      ).toBe('true')
    })

    it('changes only that class and sends the record version back', async () => {
      renderDetail('/DE/REDUCED')
      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Reduced rate')
      )

      type(inputIn('tax-class-name'), 'Lower rate')
      type(inputIn('tax-class-description'), 'Food and books')
      await save()

      await waitFor(() => expect(updateTaxCall).toHaveBeenCalledTimes(1))
      expect(updateTaxCall).toHaveBeenCalledWith(
        'DE',
        {
          location: { countryCode: 'DE' },
          taxClasses: [
            germany.taxClasses[0],
            {
              code: 'REDUCED',
              name: { en: 'Lower rate' },
              description: { en: 'Food and books' },
              rate: 7,
              order: 2,
            },
          ],
          metadata: { version: 3 },
        },
        { tenant: 'tenant-a' }
      )
      expect(toast.showSuccess).toHaveBeenCalledWith('Tax Class was edited!')
      await waitFor(() => expect(location()).toBe('/'))
    })

    it('keeps the stored fields the form does not show', async () => {
      renderDetail('/DE/STANDARD')
      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Standard rate')
      )

      type(inputIn('tax-class-name'), 'Regular')
      await save()

      await waitFor(() => expect(updateTaxCall).toHaveBeenCalledTimes(1))
      const body = vi.mocked(updateTaxCall).mock.calls[0][1]
      expect(body.taxClasses[0]).toEqual(
        expect.objectContaining({
          code: 'STANDARD',
          order: 1,
          isDefault: true,
          name: { en: 'Regular' },
        })
      )
    })

    it('accepts one fraction digit of the rate, as MD did', async () => {
      renderDetail('/DE/REDUCED')
      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Reduced rate')
      )

      const rate = inputIn('tax-class-rate')
      fireEvent.focus(rate)
      rate.setSelectionRange(0, rate.value.length)
      for (const char of '7.25') {
        fireEvent.keyPress(rate, {
          key: char,
          charCode: char.charCodeAt(0),
        })
      }
      fireEvent.blur(rate)
      await save()

      await waitFor(() => expect(updateTaxCall).toHaveBeenCalledTimes(1))
      const body = vi.mocked(updateTaxCall).mock.calls[0][1]
      expect(body.taxClasses[1].rate).toBe(7.2)
    })

    it('discards the changes', async () => {
      renderDetail('/DE/REDUCED')
      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Reduced rate')
      )

      type(inputIn('tax-class-name'), 'Other')
      fireEvent.click(discardButton())

      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Reduced rate')
      )
      expect(updateTaxCall).not.toHaveBeenCalled()
    })

    it('returns to the list when the host switches tenant', async () => {
      const { switchTenant } = renderDetail('/DE/REDUCED', 'tenant-a')
      await waitFor(() =>
        expect(inputIn('tax-class-code').value).toBe('REDUCED')
      )

      switchTenant('tenant-b')

      await waitFor(() => expect(location()).toBe('/'))
    })
  })

  describe('Scenario 9: read-only edit for a viewer', () => {
    it('makes every field read-only and disables Discard and Save', async () => {
      permissions.granted = [EmployeeDomains.TAXES_VIEWER]
      renderDetail('/DE/STANDARD')

      await waitFor(() =>
        expect(inputIn('tax-class-code').value).toBe('STANDARD')
      )
      for (const id of [
        'tax-class-code',
        'tax-class-rate',
        'tax-class-name',
        'tax-class-description',
      ]) {
        expect(inputIn(id).disabled).toBe(true)
      }
      expect(
        screen
          .getByTestId('tax-class-country-control')
          .getAttribute('aria-disabled')
      ).toBe('true')
      expect(saveButton().disabled).toBe(true)
      expect(discardButton().disabled).toBe(true)
    })
  })

  describe('Scenario 12: failures are visible', () => {
    it('shows an error toast and stays when the record cannot be loaded', async () => {
      vi.mocked(getTaxCall).mockRejectedValue(new Error('boom'))
      renderDetail('/DE/STANDARD')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading taxes. Please try again later',
          undefined
        )
      )
      expect(location()).toBe('/DE/STANDARD')
      expect(saveButton().disabled).toBe(true)
    })

    it('shows an error toast when the class is not in the record', async () => {
      renderDetail('/DE/UNKNOWN')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith('Tax class not found')
      )
      expect(location()).toBe('/DE/UNKNOWN')
    })

    it('shows an error toast, keeps the values and stays when the lookup fails', async () => {
      vi.mocked(getTaxCall).mockRejectedValue(
        Object.assign(new Error('boom'), { response: { status: 500 } })
      )
      renderDetail('/add')

      await pickCountry('DE - Germany')
      type(inputIn('tax-class-code'), 'abc')
      await save()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Something went wrong. Check form data or try later.',
          undefined
        )
      )
      expect(createTaxCall).not.toHaveBeenCalled()
      expect(inputIn('tax-class-code').value).toBe('ABC')
      expect(location()).toBe('/add')
    })

    it('shows an error toast and stays when an add fails', async () => {
      vi.mocked(getTaxCall).mockRejectedValue(notFound())
      vi.mocked(createTaxCall).mockRejectedValue(new Error('boom'))
      renderDetail('/add')

      await pickCountry('PL - Poland')
      type(inputIn('tax-class-code'), 'vat')
      await save()

      await waitFor(() => expect(toast.showError).toHaveBeenCalled())
      expect(toast.showSuccess).not.toHaveBeenCalled()
      expect(location()).toBe('/add')
    })

    it('shows an error toast and stays when an edit fails', async () => {
      vi.mocked(updateTaxCall).mockRejectedValue(new Error('boom'))
      renderDetail('/DE/REDUCED')
      await waitFor(() =>
        expect(inputIn('tax-class-name').value).toBe('Reduced rate')
      )

      type(inputIn('tax-class-name'), 'Other')
      await save()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Something went wrong. Check form data or try later.',
          undefined
        )
      )
      expect(toast.showSuccess).not.toHaveBeenCalled()
      expect(location()).toBe('/DE/REDUCED')
      expect(inputIn('tax-class-name').value).toBe('Other')
    })
  })
})
