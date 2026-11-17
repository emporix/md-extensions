/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import {
  fetchSingleConfiguration,
  updateSingleConfiguration,
} from '@emporix/api-calls'
import { DashboardProvider } from '../context/Dashboard.context'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import { useClassificationsTableConfig } from './useClassificationsTableConfig'

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchSingleConfiguration: vi.fn(),
    updateSingleConfiguration: vi.fn(),
  }
})

const storedMixins = [
  { key: 'seo.title', label: { en: 'Title' }, type: 'TEXT' },
]
const storedColumns = [
  { key: 'validFrom', label: 'Valid From', visible: false },
]

const tenantRef = { current: 'tnt' }

const wrapper = ({ children }: { children: ReactNode }) => (
  <DashboardProvider
    appState={{
      tenant: tenantRef.current,
      token: 'token',
      language: 'en',
      contentLanguage: 'en',
      onError: () => undefined,
    }}
  >
    <RefreshValuesProvider>{children}</RefreshValuesProvider>
  </DashboardProvider>
)

const stored = (table: { columns?: unknown[]; mixins?: unknown[] }) =>
  ({ key: 'ext_classifications', value: { table } }) as never

const notFound = () =>
  Object.assign(new Error('Not Found'), { response: { status: 404 } })

describe('useClassificationsTableConfig', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    tenantRef.current = 'tnt'
  })

  it('reads the ext_classifications preference with its own request', async () => {
    vi.mocked(fetchSingleConfiguration).mockResolvedValue(
      stored({ columns: storedColumns })
    )
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(storedColumns)
    )
    expect(fetchSingleConfiguration).toHaveBeenCalledWith(
      'tnt',
      'ext_classifications'
    )
  })

  it('stores the preference in the MD shape and reads it back', async () => {
    const columns = [{ key: 'validFrom', label: 'Valid From', visible: true }]
    vi.mocked(fetchSingleConfiguration)
      .mockResolvedValueOnce(stored({ columns: storedColumns }))
      .mockResolvedValueOnce(stored({ columns }))
    vi.mocked(updateSingleConfiguration).mockResolvedValue(true)
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })
    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(storedColumns)
    )

    await act(async () => {
      await result.current.saveTableConfig(columns)
    })

    expect(updateSingleConfiguration).toHaveBeenCalledWith(
      'tnt',
      'ext_classifications',
      {
        key: 'ext_classifications',
        value: { table: { columns, mixins: [] } },
      }
    )
    expect(result.current.visibleColumns).toEqual(columns)
  })

  it('writes mixin columns stored by the built-in screen back unchanged', async () => {
    vi.mocked(fetchSingleConfiguration).mockResolvedValue(
      stored({ columns: storedColumns, mixins: storedMixins })
    )
    vi.mocked(updateSingleConfiguration).mockResolvedValue(true)
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })
    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(storedColumns)
    )

    const columns = [{ key: 'validTo', label: 'Valid To', visible: false }]
    await act(async () => {
      await result.current.saveTableConfig(columns)
    })

    expect(updateSingleConfiguration).toHaveBeenCalledWith(
      'tnt',
      'ext_classifications',
      {
        key: 'ext_classifications',
        value: { table: { columns, mixins: storedMixins } },
      }
    )
  })

  it('shows every column when nothing is stored yet', async () => {
    vi.mocked(fetchSingleConfiguration).mockRejectedValue(notFound())
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })

    await waitFor(() => expect(fetchSingleConfiguration).toHaveBeenCalled())
    expect(result.current.visibleColumns).toEqual([])
  })

  it('drops the preference of the previous tenant', async () => {
    vi.mocked(fetchSingleConfiguration).mockImplementation(async (tenant) =>
      tenant === 'tnt' ? stored({ columns: storedColumns }) : stored({})
    )
    const { result, rerender } = renderHook(
      () => useClassificationsTableConfig(),
      { wrapper }
    )
    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(storedColumns)
    )

    tenantRef.current = 'other'
    rerender()

    await waitFor(() =>
      expect(fetchSingleConfiguration).toHaveBeenCalledWith(
        'other',
        'ext_classifications'
      )
    )
    await waitFor(() => expect(result.current.visibleColumns).toEqual([]))
  })
})
