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
import { LocationType } from '../models/LegalEntity.model'
import LocationAddEditPage from './LocationAddEdit.page'

const api = vi.hoisted(() => ({
  getLocation: vi.fn(),
  updateLocation: vi.fn(),
  createLocation: vi.fn(),
  deleteLocation: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const mixins = vi.hoisted(() => ({
  forms: [] as { id: string }[],
  loadMixins: vi.fn(),
}))

vi.mock('../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => api,
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

// The mixins subsystem is copied and tested separately: the page contract is
// that its tabs appear when mixins exist and `?mixin=` selects one.
vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: () => ({
    loadMixins: mixins.loadMixins,
    isMixinsLoading: false,
    mixinsForms: mixins.forms,
    mixinsTabs: mixins.forms.map((form) => ({
      id: form.id,
      label: form.id,
      content: <div>{`${form.id}-form`}</div>,
    })),
  }),
}))

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
          path="/:companyId/locations/:locationId?"
          element={<LocationAddEditPage />}
        />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  )

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
const addTag = (value: string) => {
  const tagsInput = screen.getByTestId('tags-input')
  fireEvent.change(tagsInput, { target: { value } })
  fireEvent.keyDown(tagsInput, { key: 'Enter' })
}

const location = {
  id: 'loc-1',
  name: 'Main office',
  type: LocationType.OFFICE,
  contactDetails: {
    addressLine1: 'Street 1',
    addressLine2: '',
    city: 'Berlin',
    state: '',
    postcode: 10115,
    countryCode: 'DE',
    tags: ['north'],
  },
  metadata: { version: 2 },
}

describe('Location add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.COMPANIES_MANAGER]
    mixins.forms = []
    api.getLocation.mockResolvedValue(location)
    api.createLocation.mockResolvedValue('new-loc')
    api.updateLocation.mockResolvedValue(undefined)
    api.deleteLocation.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    for (const fn of Object.values(api)) fn.mockReset()
  })

  // Scenario 9
  it('creates a location with typed tags and opens its edit page', async () => {
    renderAt('/c1/locations')
    expect(button('location-save').disabled).toBe(true)

    typeInto('location-name', 'Warehouse North')
    typeInto('location-postcode', '12345')
    pickOption('type', 0)
    pickOption('country', 1)
    addTag('north')
    // `addOnBlur`, as MD's Prime Chips
    const tagsInput = screen.getByTestId('tags-input')
    fireEvent.change(tagsInput, { target: { value: 'south' } })
    fireEvent.blur(tagsInput)

    await waitFor(() => expect(button('location-save').disabled).toBe(false))
    fireEvent.click(button('location-save'))

    await waitFor(() => expect(api.createLocation).toHaveBeenCalledTimes(1))
    const [companyId, payload] = api.createLocation.mock.calls[0]
    expect(companyId).toBe('c1')
    expect(payload).not.toHaveProperty('id')
    expect(payload).toMatchObject({
      name: 'Warehouse North',
      type: LocationType.WAREHOUSE,
      contactDetails: {
        countryCode: 'PL',
        postcode: 12345,
        tags: ['north', 'south'],
      },
    })
    await waitFor(() => expect(currentPath()).toBe('/c1/locations/new-loc'))
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.any(String),
      '',
      'success'
    )
  })

  it('keeps Save disabled until a country is picked', async () => {
    renderAt('/c1/locations')
    typeInto('location-name', 'No country')
    await waitFor(() => expect(button('location-discard').disabled).toBe(false))
    expect(button('location-save').disabled).toBe(true)
  })

  it('shows an error toast when creating fails', async () => {
    api.createLocation.mockRejectedValue({
      response: { data: { message: 'Invalid id' } },
    })
    renderAt('/c1/locations')
    typeInto('location-name', 'Broken')
    pickOption('country', 0)
    await waitFor(() => expect(button('location-save').disabled).toBe(false))
    fireEvent.click(button('location-save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        expect.any(String),
        'Invalid id'
      )
    )
    expect(currentPath()).toBe('/c1/locations')
  })

  it('edits an existing location and keeps its id read-only', async () => {
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )
    expect(input('location-id').readOnly).toBe(true)
    expect(screen.getByTestId('tags-chip-0').textContent).toContain('north')

    typeInto('location-name', 'Renamed office')
    await waitFor(() => expect(button('location-save').disabled).toBe(false))
    fireEvent.click(button('location-save'))

    await waitFor(() => expect(api.updateLocation).toHaveBeenCalledTimes(1))
    expect(api.updateLocation.mock.calls[0][0]).toMatchObject({
      id: 'loc-1',
      name: 'Renamed office',
      metadata: { version: 2 },
      contactDetails: { countryCode: 'DE', postcode: 10115, tags: ['north'] },
    })
    // Reloads the saved location.
    await waitFor(() => expect(api.getLocation).toHaveBeenCalledTimes(2))
  })

  it('deletes a location and returns to the company', async () => {
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )

    fireEvent.click(button('location-delete'))

    await waitFor(() =>
      expect(api.deleteLocation).toHaveBeenCalledWith('loc-1')
    )
    await waitFor(() => expect(currentPath()).toBe('/c1'))
  })

  it('discards unsaved changes', async () => {
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )
    typeInto('location-name', 'Changed')
    await waitFor(() => expect(button('location-discard').disabled).toBe(false))

    fireEvent.click(button('location-discard'))

    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )
  })

  // Scenario 10
  it('shows mixin tabs only when mixins exist', async () => {
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )
    expect(screen.queryByTestId('location-tabs')).toBeNull()
    expect(mixins.loadMixins).toHaveBeenCalled()
  })

  it('opens the mixin tab named by ?mixin=', async () => {
    mixins.forms = [{ id: 'logistics' }, { id: 'info' }]
    renderAt('/c1/locations/loc-1?mixin=info')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )

    expect(screen.getByTestId('location-tabs-tab-general')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByText('info-form').closest('[hidden]')).toBeNull()
    )
    expect(input('location-name').closest('[hidden]')).not.toBeNull()
    expect(
      screen.getByText('logistics-form').closest('[hidden]')
    ).not.toBeNull()
  })

  it('starts on the General tab without ?mixin=', async () => {
    mixins.forms = [{ id: 'info' }]
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )
    expect(input('location-name').closest('[hidden]')).toBeNull()
    expect(screen.getByText('info-form').closest('[hidden]')).not.toBeNull()
  })

  // Scenario 3
  it('is read-only without Companies Manager', async () => {
    permissions.granted = []
    renderAt('/c1/locations/loc-1')
    await waitFor(() =>
      expect(input('location-name').value).toBe('Main office')
    )

    for (const id of [
      'location-id',
      'location-name',
      'location-addressLine1',
      'location-city',
      'location-postcode',
    ]) {
      expect(input(id).readOnly).toBe(true)
    }
    expect(
      (screen.getByTestId('tags-input') as HTMLInputElement).disabled
    ).toBe(true)
    expect(button('location-delete').disabled).toBe(true)
    expect(button('location-save').disabled).toBe(true)
  })
})
