/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createNewCoupon,
  fetchCoupon,
  fetchCurrencies,
  modifyCoupon,
  patchCouponCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import CouponRoute from './CouponRoute'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const mixins = vi.hoisted(() => ({
  onEdit: undefined as
    | undefined
    | ((data: unknown, meta: { key: string; url: string }) => Promise<void>),
  loadMixins: vi.fn(),
}))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchCoupon: vi.fn(),
    createNewCoupon: vi.fn(),
    modifyCoupon: vi.fn(),
    patchCouponCall: vi.fn(),
    fetchCurrencies: vi.fn(),
  }
})

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

// The mixins subsystem is the copied, separately tested `orders` one: the page
// contract is that it is loaded for an existing coupon and saved by PATCH.
vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: ({
    onEdit,
  }: {
    onEdit: (data: unknown, meta: { key: string; url: string }) => Promise<void>
  }) => {
    mixins.onEdit = onEdit
    return {
      loadMixins: mixins.loadMixins,
      isMixinsLoading: false,
      mixinsTabs: [
        { id: 'mixin-loyalty', label: 'Loyalty', content: <div>loyalty</div> },
      ],
    }
  },
}))

vi.mock('../components/auditLog/EntityChangelogTab', () => ({
  default: ({ entity, entityId }: { entity: string; entityId: string }) => (
    <div data-testid="changelog">{`${entity}:${entityId}`}</div>
  ),
}))

const { selectorStub } = vi.hoisted(() => ({
  selectorStub:
    (name: string, picked: string) =>
    ({
      value,
      onChange,
      canManage,
    }: {
      value?: string[]
      onChange: (v: string[]) => void
      canManage?: boolean
    }) => (
      <div data-testid={`${name}-selector`}>
        <span>{(value ?? []).join(',')}</span>
        <button
          type="button"
          disabled={!canManage}
          onClick={() => onChange([picked])}
        >
          {`pick ${name}`}
        </button>
      </div>
    ),
}))

vi.mock('../components/shared/CustomersSelector', () => ({
  default: selectorStub('customers', 'C-1'),
}))
vi.mock('../components/shared/SegmentsSelector', () => ({
  default: selectorStub('segments', 'seg-1'),
}))
vi.mock('../components/shared/CategoriesSelector', () => ({
  default: selectorStub('categories', 'cat-1'),
}))
vi.mock('../components/shared/VendorsSelector', () => ({
  default: selectorStub('vendors', 'ven-1'),
}))

const MANAGER = [
  EmployeeDomains.COUPONS_VIEWER,
  EmployeeDomains.COUPONS_MANAGER,
  EmployeeDomains.CUSTOMERS_VIEWER,
  EmployeeDomains.SEGMENTS_VIEWER,
  EmployeeDomains.CATEGORIES_VIEWER,
  EmployeeDomains.VENDORS_VIEWER,
  EmployeeDomains.AUDIT_LOG_VIEWER,
]

const coupon = {
  code: 'SALE#1',
  name: 'Spring sale',
  description: 'Ten off',
  discountType: 'PERCENT',
  discountPercentage: 10,
  discountCalculationType: 'SUBTOTAL',
  allowAnonymous: false,
  segmentRestricted: false,
  categoryRestricted: false,
  vendorRestricted: false,
  restrictions: {},
  mixins: { loyalty: { tier: 'gold' } },
  metadata: { mixins: { loyalty: 'https://schema/loyalty.json' } },
}

const renderCoupon = (path: string) =>
  renderAt(path, { list: <div>list</div>, detail: <CouponRoute /> }, 'tnt')

const location = () => screen.getByTestId('location').textContent
const saveButton = () =>
  screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement
const discardButton = () =>
  screen.getByRole('button', { name: 'Discard' }) as HTMLButtonElement
const input = (id: string) => document.getElementById(id) as HTMLInputElement
const typeInto = (id: string, value: string) =>
  fireEvent.change(input(id), { target: { value } })
const tab = (id: string) => screen.queryByTestId(`coupon-tabs-tab-${id}`)
const openTab = (id: string) => {
  const button = tab(id)
  if (!button) throw new Error(`no tab ${id}`)
  fireEvent.click(button)
}

describe('Coupon add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [...MANAGER]
    vi.mocked(fetchCurrencies).mockResolvedValue([
      { code: 'EUR', name: { en: 'Euro' } },
      { code: 'USD', name: { en: 'US Dollar' } },
    ] as never)
    vi.mocked(fetchCoupon).mockResolvedValue(coupon as never)
    vi.mocked(createNewCoupon).mockResolvedValue('NEW10')
    vi.mocked(modifyCoupon).mockResolvedValue(true)
    vi.mocked(patchCouponCall).mockResolvedValue(true)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    for (const fn of [
      fetchCoupon,
      createNewCoupon,
      modifyCoupon,
      patchCouponCall,
      fetchCurrencies,
    ]) {
      vi.mocked(fn).mockReset()
    }
  })

  // Scenario 4
  it('creates a coupon and opens its edit page', async () => {
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())

    typeInto('coupon-name', 'New ten')
    typeInto('coupon-code', 'NEW10')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Coupon was created!')
    )
    const [tenant, payload] = vi.mocked(createNewCoupon).mock.calls[0]
    expect(tenant).toBe('tnt')
    expect(payload).toMatchObject({
      code: 'NEW10',
      name: 'New ten',
      discountType: 'ABSOLUTE',
      discountAbsolute: { currency: 'EUR' },
    })
    await waitFor(() => expect(location()).toBe('/NEW10'))
  })

  // Scenario 5
  it('shows field messages and sends nothing for an invalid form', async () => {
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())

    typeInto('coupon-code', 'add')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    expect(await screen.findByText('This field is required')).toBeTruthy()
    expect(
      screen.getByText('The code "add" is reserved. Choose another code.')
    ).toBeTruthy()
    expect(toast.showError).toHaveBeenCalledWith(
      'Please correct the highlighted fields'
    )
    expect(createNewCoupon).not.toHaveBeenCalled()
  })

  // Scenario 6
  it('maps a rejected save onto the field and keeps the values', async () => {
    vi.mocked(createNewCoupon).mockRejectedValue({
      response: {
        status: 400,
        data: {
          details: [{ field: 'name', message: 'Name is too long' }],
        },
      },
    })
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())

    typeInto('coupon-name', 'Too long name')
    typeInto('coupon-code', 'LONG')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    expect(await screen.findByText('Name is too long')).toBeTruthy()
    expect(input('coupon-name').value).toBe('Too long name')
    expect(location()).toBe('/add')
  })

  it('marks a duplicate code on create', async () => {
    vi.mocked(createNewCoupon).mockRejectedValue({
      response: { status: 409, data: {} },
    })
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())

    typeInto('coupon-name', 'Dup')
    typeInto('coupon-code', 'DUP')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while creating coupon',
        expect.stringContaining("Duplicate coupon 'DUP' on tenant 'tnt'"),
        6000
      )
    )
  })

  // Scenario 7
  it('updates an existing coupon by its original code', async () => {
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')

    expect(input('coupon-code').value).toBe('SALE#1')
    expect(input('coupon-code').readOnly).toBe(true)
    typeInto('coupon-name', 'Summer sale')
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Coupon was updated!')
    )
    const [tenant, payload, oldCode] = vi.mocked(modifyCoupon).mock.calls[0]
    expect(tenant).toBe('tnt')
    expect(oldCode).toBe('SALE#1')
    expect(payload).toMatchObject({ code: 'SALE#1', name: 'Summer sale' })
    await waitFor(() => expect(fetchCoupon).toHaveBeenCalledTimes(2))
  })

  // Scenario 8
  it('discards changes back to the loaded values', async () => {
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')

    typeInto('coupon-name', 'Changed')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    fireEvent.click(discardButton())

    await waitFor(() => expect(input('coupon-name').value).toBe('Spring sale'))
    expect(modifyCoupon).not.toHaveBeenCalled()
  })

  // Scenario 9
  it('returns to the list when the coupon cannot be loaded', async () => {
    vi.mocked(fetchCoupon).mockRejectedValue({
      response: { data: { message: 'Not found' } },
    })
    renderCoupon('/MISSING')

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading coupon',
        'Not found'
      )
    )
    await waitFor(() => expect(location()).toBe('/'))
  })

  it('returns to the list when the host switches tenant', async () => {
    const { switchTenant } = renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')
    typeInto('coupon-name', 'Edited for tnt')

    switchTenant('other')

    await waitFor(() => expect(location()).toBe('/'))
    expect(screen.queryByDisplayValue('Edited for tnt')).toBeNull()
    expect(fetchCoupon).toHaveBeenCalledTimes(1)
    expect(fetchCoupon).not.toHaveBeenCalledWith('other', 'SALE#1')
    expect(modifyCoupon).not.toHaveBeenCalled()
  })

  // Scenario 3 (form)
  it('keeps the form read-only for a viewer', async () => {
    permissions.granted = [EmployeeDomains.COUPONS_VIEWER]
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')

    expect(input('coupon-name').readOnly).toBe(true)
    expect(input('coupon-description').readOnly).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
  })

  // Scenario 10
  it('shows the inputs of the chosen discount type with tenant currencies', async () => {
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())
    openTab('types')

    // New coupons start as an absolute discount in the first tenant currency.
    expect(await screen.findByText('Absolute value discount')).toBeTruthy()
    expect(screen.queryByText('Percentage discount')).toBeNull()
    expect(screen.getByTestId('currency').textContent).toContain('EUR')

    fireEvent.click(screen.getByTestId('coupon-type-control'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Percent' }))

    expect(await screen.findByText('Percentage discount')).toBeTruthy()
    expect(screen.queryByText('Absolute value discount')).toBeNull()
  })

  // Scenario 11
  it('saves a segment restriction picked in the rules tab', async () => {
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')
    openTab('rules')

    fireEvent.click(screen.getByLabelText(/Customer segment\(s\)/))
    fireEvent.click(await screen.findByText('pick segments'))
    fireEvent.click(saveButton())

    await waitFor(() => expect(modifyCoupon).toHaveBeenCalled())
    const payload = vi.mocked(modifyCoupon).mock.calls[0][1]
    expect(payload).toMatchObject({
      segmentRestricted: true,
      restrictions: { segments: ['seg-1'] },
    })
  })

  it('locks a restriction the operator may not view', async () => {
    permissions.granted = MANAGER.filter(
      (domain) => domain !== EmployeeDomains.CUSTOMERS_VIEWER
    )
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')
    openTab('rules')

    const specific = screen.getByLabelText(
      /Specific customer\(s\)/
    ) as HTMLInputElement
    const segments = screen.getByLabelText(
      /Customer segment\(s\)/
    ) as HTMLInputElement
    expect(specific.disabled).toBe(true)
    expect(segments.disabled).toBe(false)
  })

  it('restricts a coupon to vendors', async () => {
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')
    openTab('rules')

    fireEvent.click(screen.getByLabelText(/Vendor specific/))
    fireEvent.click(await screen.findByText('pick vendors'))
    fireEvent.click(saveButton())

    await waitFor(() => expect(modifyCoupon).toHaveBeenCalled())
    expect(vi.mocked(modifyCoupon).mock.calls[0][1]).toMatchObject({
      vendorRestricted: true,
      restrictions: { vendors: ['ven-1'] },
    })
  })

  // Scenario 12
  it('shows mixin and audit log tabs for an existing coupon and saves a mixin by patch', async () => {
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')

    expect(tab('mixin-loyalty')?.textContent).toBe('Loyalty')
    expect(mixins.loadMixins).toHaveBeenCalledWith(
      coupon.metadata.mixins,
      coupon.mixins
    )
    openTab('audit-log')
    expect(screen.getByTestId('changelog').textContent).toBe('coupon:SALE#1')

    await mixins.onEdit?.(
      { tier: 'silver' },
      { key: 'loyalty', url: 'https://schema/loyalty.json' }
    )
    expect(patchCouponCall).toHaveBeenCalledWith(
      'tnt',
      {
        mixins: { loyalty: { tier: 'silver' } },
        metadata: { mixins: { loyalty: 'https://schema/loyalty.json' } },
      },
      'SALE#1'
    )
    expect(toast.showSuccess).toHaveBeenCalledWith('Coupon was updated!')
  })

  it('hides mixin tabs and disables the audit log on create', async () => {
    renderCoupon('/add')
    await waitFor(() => expect(fetchCurrencies).toHaveBeenCalled())

    expect(tab('mixin-loyalty')).toBeNull()
    expect(tab('audit-log')?.getAttribute('aria-disabled')).toBe('true')
  })

  it('hides the audit log without Audit Log Viewer', async () => {
    permissions.granted = MANAGER.filter(
      (domain) => domain !== EmployeeDomains.AUDIT_LOG_VIEWER
    )
    renderCoupon('/SALE%231')
    await screen.findByText('Spring sale')

    expect(tab('audit-log')).toBeNull()
    expect(tab('mixin-loyalty')).toBeTruthy()
  })
})
