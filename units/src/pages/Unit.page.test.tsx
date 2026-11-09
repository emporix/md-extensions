/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createUnitCall,
  getAllUnitTypesCall,
  getUnitByCodeCall,
  updateUnitCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import UnitPage from './Unit.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls', () => ({
  getAllUnitsPaginatedCall: vi.fn(),
  getUnitByCodeCall: vi.fn(),
  getAllUnitTypesCall: vi.fn(),
  createUnitCall: vi.fn(),
  updateUnitCall: vi.fn(),
  deleteUnitCall: vi.fn(),
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

const loaded = {
  code: 'kg',
  name: { en: 'Kilogram' },
  symbol: 'kg',
  type: 'mass',
  baseUnit: true,
  factor: 1,
  metadata: { version: 4 },
}

const renderDetail = (path: string, tenant = 'tenant-a') =>
  renderAt(path, { list: <div>list</div>, detail: <UnitPage /> }, tenant)

const inputIn = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}
const saveButton = () => screen.getByTestId('unit-save') as HTMLButtonElement
const discardButton = () =>
  screen.getByTestId('unit-discard') as HTMLButtonElement
const nameInput = () => inputIn('unit-name')
const codeInput = () => inputIn('unit-code')
const symbolInput = () => inputIn('unit-symbol')
const typeInput = () => inputIn('unit-type')

const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })

const fillRequired = () => {
  type(nameInput(), 'Gram')
  type(codeInput(), 'g')
  type(typeInput(), 'mass')
}

describe('Unit add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.UNITS_VIEWER,
      EmployeeDomains.UNITS_MANAGER,
    ]
    vi.mocked(getUnitByCodeCall).mockResolvedValue(loaded)
    vi.mocked(getAllUnitTypesCall).mockResolvedValue(['mass', 'volume'])
    vi.mocked(createUnitCall).mockResolvedValue()
    vi.mocked(updateUnitCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens the edit page of a new code that needs URL encoding', async () => {
    renderDetail('/add')

    type(nameInput(), 'Kilometre per hour')
    type(codeInput(), 'km/h')
    type(typeInput(), 'speed')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/km%2Fh')
    )
  })

  it('creates a unit and switches to its edit page', async () => {
    renderDetail('/add')

    fillRequired()
    type(symbolInput(), 'g')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/g')
    )
    expect(createUnitCall).toHaveBeenCalledWith('tenant-a', {
      code: 'g',
      name: { en: 'Gram' },
      type: 'mass',
      symbol: 'g',
      baseUnit: false,
      factor: 1,
    })
    expect(toast.showSuccess).toHaveBeenCalledWith('Unit was created!')
  })

  it('keeps a type that is not in the tenant list and sends it', async () => {
    renderDetail('/add')
    await waitFor(() => expect(getAllUnitTypesCall).toHaveBeenCalled())

    type(nameInput(), 'Piece')
    type(codeInput(), 'pc')
    type(typeInput(), 'count')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    expect(typeInput().value).toBe('count')
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(createUnitCall).toHaveBeenCalledWith(
        'tenant-a',
        expect.objectContaining({ type: 'count' })
      )
    )
  })

  it('suggests the tenant types that match the typed text', async () => {
    renderDetail('/add')
    await waitFor(() => expect(getAllUnitTypesCall).toHaveBeenCalled())

    type(typeInput(), 'vol')

    expect(await screen.findByText('volume')).toBeTruthy()
    expect(screen.queryByText('mass')).toBeNull()
  })

  it.each([
    ['the code', () => type(codeInput(), '  ')],
    ['the type', () => type(typeInput(), '')],
    ['the name in every language', () => type(nameInput(), ' ')],
  ])('keeps save disabled while %s is empty', async (_label, clear) => {
    renderDetail('/add')

    fillRequired()
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    clear()

    await waitFor(() => expect(saveButton().disabled).toBe(true))
    expect(discardButton().disabled).toBe(false)
  })

  it('shows the generic error and keeps the values when create fails', async () => {
    vi.mocked(createUnitCall).mockRejectedValue(new Error('conflict'))
    renderDetail('/add')

    fillRequired()
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Something went wrong. Check form data or try later.',
        undefined
      )
    )
    expect(screen.getByTestId('location').textContent).toBe('/add')
    expect(codeInput().value).toBe('g')
    expect(nameInput().value).toBe('Gram')
  })

  it('opens an existing unit with its values and the code read-only', async () => {
    renderDetail('/kg')

    await waitFor(() => expect(codeInput().value).toBe('kg'))
    expect(getUnitByCodeCall).toHaveBeenCalledWith('tenant-a', 'kg')
    expect(nameInput().value).toBe('Kilogram')
    expect(typeInput().value).toBe('mass')
    expect(codeInput().disabled).toBe(true)
    expect(symbolInput().disabled).toBe(false)
  })

  it('loads and updates a unit whose code needs URL encoding', async () => {
    vi.mocked(getUnitByCodeCall).mockResolvedValue({ ...loaded, code: 'km/h' })
    renderDetail('/km%2Fh')

    await waitFor(() => expect(codeInput().value).toBe('km/h'))
    expect(getUnitByCodeCall).toHaveBeenCalledWith('tenant-a', 'km%2Fh')

    type(symbolInput(), 'km/h')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(updateUnitCall).toHaveBeenCalledWith(
        'tenant-a',
        'km%2Fh',
        expect.objectContaining({ code: 'km/h' })
      )
    )
  })

  it('updates with the loaded version and reloads the saved values', async () => {
    renderDetail('/kg')
    await waitFor(() => expect(symbolInput().value).toBe('kg'))

    type(symbolInput(), 'KG')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Unit was edited!')
    )
    expect(updateUnitCall).toHaveBeenCalledWith('tenant-a', 'kg', {
      code: 'kg',
      name: { en: 'Kilogram' },
      type: 'mass',
      symbol: 'KG',
      baseUnit: true,
      factor: 1,
      metadata: { version: 4 },
    })
    await waitFor(() => expect(getUnitByCodeCall).toHaveBeenCalledTimes(2))
  })

  it('shows the generic error and keeps the values when an update fails', async () => {
    vi.mocked(updateUnitCall).mockRejectedValue(new Error('stale'))
    renderDetail('/kg')
    await waitFor(() => expect(symbolInput().value).toBe('kg'))

    type(symbolInput(), 'KG')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Something went wrong. Check form data or try later.',
        undefined
      )
    )
    expect(symbolInput().value).toBe('KG')
  })

  it('returns the form to the loaded values on discard', async () => {
    renderDetail('/kg')
    await waitFor(() => expect(symbolInput().value).toBe('kg'))

    type(symbolInput(), 'other')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    fireEvent.click(discardButton())

    await waitFor(() => expect(symbolInput().value).toBe('kg'))
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
  })

  it('sends the operator to the add page when the code cannot be loaded', async () => {
    vi.mocked(getUnitByCodeCall).mockRejectedValue(new Error('404'))
    renderDetail('/missing')

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/add')
    )
    expect(toast.showError).toHaveBeenCalledWith(
      'Unit not found. Please create a new one',
      undefined
    )
  })

  it('makes the form read-only for a viewer', async () => {
    permissions.granted = [EmployeeDomains.UNITS_VIEWER]
    renderDetail('/kg')
    await waitFor(() => expect(codeInput().value).toBe('kg'))

    expect(nameInput().disabled).toBe(true)
    expect(symbolInput().disabled).toBe(true)
    expect(typeInput().disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
  })

  it('clears and locks the form while another tenant loads the unit', async () => {
    const { switchTenant } = renderDetail('/kg', 'tenant-a')
    await waitFor(() => expect(symbolInput().value).toBe('kg'))
    type(symbolInput(), 'KG')
    await waitFor(() => expect(saveButton().disabled).toBe(false))

    vi.mocked(getUnitByCodeCall).mockReturnValue(new Promise(() => {}))
    switchTenant('tenant-b')

    await waitFor(() => expect(saveButton().disabled).toBe(true))
    expect(symbolInput().value).toBe('')
    expect(symbolInput().disabled).toBe(true)
    expect(getUnitByCodeCall).toHaveBeenLastCalledWith('tenant-b', 'kg')
    expect(updateUnitCall).not.toHaveBeenCalled()
  })
})
