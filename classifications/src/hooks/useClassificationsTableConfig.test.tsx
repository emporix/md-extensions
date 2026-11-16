/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import {
  fetchBasicConfiguration,
  updateSingleConfiguration,
} from '@emporix/api-calls'
import { DashboardProvider } from '../context/Dashboard.context'
import { ConfigurationProvider } from '../context/ConfigurationProvider'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import { useClassificationsTableConfig } from './useClassificationsTableConfig'

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchBasicConfiguration: vi.fn(),
    updateSingleConfiguration: vi.fn(),
  }
})

const storedMixins = [
  { key: 'seo.title', label: { en: 'Title' }, type: 'TEXT' },
]
const storedColumns = [
  { key: 'validFrom', label: 'Valid From', visible: false },
]

const wrapper = ({ children }: { children: ReactNode }) => (
  <DashboardProvider
    appState={{
      tenant: 'tnt',
      token: 'token',
      language: 'en',
      contentLanguage: 'en',
      onError: () => undefined,
    }}
  >
    <ConfigurationProvider>
      <RefreshValuesProvider>{children}</RefreshValuesProvider>
    </ConfigurationProvider>
  </DashboardProvider>
)

const mockConfiguration = (tableConfigurations: unknown[]) => {
  vi.mocked(fetchBasicConfiguration).mockResolvedValue({
    currencies: [],
    languages: [],
    tableConfigurations,
  } as never)
  vi.mocked(updateSingleConfiguration).mockResolvedValue(true)
}

describe('useClassificationsTableConfig', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('reads and stores the ext_classifications preference in the MD shape', async () => {
    mockConfiguration([{ key: 'ext_classifications', columns: storedColumns }])
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(storedColumns)
    )

    const columns = [{ key: 'validFrom', label: 'Valid From', visible: true }]
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
    // The saved preference is read back.
    expect(fetchBasicConfiguration).toHaveBeenCalledTimes(2)
  })

  it('writes mixin columns stored by the built-in screen back unchanged', async () => {
    mockConfiguration([
      {
        key: 'ext_classifications',
        columns: storedColumns,
        mixins: storedMixins,
      },
    ])
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

  it('ignores the preference of another table', async () => {
    mockConfiguration([{ key: 'ext_categories', columns: storedColumns }])
    const { result } = renderHook(() => useClassificationsTableConfig(), {
      wrapper,
    })

    await waitFor(() => expect(fetchBasicConfiguration).toHaveBeenCalled())
    expect(result.current.visibleColumns).toEqual([])
  })
})
