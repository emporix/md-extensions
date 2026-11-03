/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Order, OrderStatus } from '../../../models/Order.model'
import OrderEntriesList from './OrderEntriesList'

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}))
// The expansion imports helpers that load `translations/i18n`, which needs the
// real `initReactI18next`.
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('../../../hooks/orders/useEntriesColumns', () => ({
  default: () => ({
    columns: [
      { columnKey: 'expander', expander: true },
      { columnKey: 'id', field: 'id', header: 'Id' },
    ],
  }),
}))
vi.mock('../../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))
vi.mock('../../../context/UIBlocker', () => ({
  useUIBlocker: () => ({ blockPanel: vi.fn() }),
}))
vi.mock('../../../contexts/OrderData.provider', () => ({
  useOrderData: () => ({ refreshData: vi.fn() }),
}))
vi.mock('../../../hooks/api/orders', () => ({
  useOrdersApi: () => ({ patchOrder: vi.fn() }),
}))
vi.mock('../../mixins/useMixinsForm', () => ({
  default: () => ({
    loadMixins: vi.fn(),
    mixinsForms: [],
    isMixinsLoading: false,
  }),
}))
vi.mock('./AddEntryDialog', () => ({ default: () => null }))

// PrimeReact's DataTable observes its size; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const order = {
  id: 'order-1',
  status: OrderStatus.CREATED,
  entries: [{ id: 'entry-1' }],
} as unknown as Order

afterEach(() => {
  cleanup()
})

describe('OrderEntriesList', () => {
  it('expands an entry without mixins and collapses it again', () => {
    render(
      <MemoryRouter>
        <OrderEntriesList order={order} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /^Expand/ }))

    expect(screen.getByText('orders.tables.entries.emptyMixins')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /^Collapse/ }))

    expect(screen.queryByText('orders.tables.entries.emptyMixins')).toBeNull()
  })
})
