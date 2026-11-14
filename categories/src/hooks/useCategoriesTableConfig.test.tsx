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
import { useCategoriesTableConfig } from './useCategoriesTableConfig'

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

const saved = {
  key: 'ext_categories',
  columns: [{ key: 'code', label: 'Code', visible: false }],
  mixins: [{ key: 'seo.title', label: { en: 'Title' }, type: 'TEXT' }],
}

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

// Scenario 2 (data side of the CL TableExtensions)
describe('useCategoriesTableConfig', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('reads and stores the ext_categories preference in the MD shape', async () => {
    vi.mocked(fetchBasicConfiguration).mockResolvedValue({
      currencies: [],
      languages: [],
      tableConfigurations: [saved],
    } as never)
    vi.mocked(updateSingleConfiguration).mockResolvedValue(true)
    const { result } = renderHook(() => useCategoriesTableConfig(), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.visibleColumns).toEqual(saved.columns)
    )
    expect(result.current.visibleMixins).toEqual(saved.mixins)

    const columns = [{ key: 'code', label: 'Code', visible: true }]
    await act(async () => {
      await result.current.saveTableConfig(columns, [])
    })

    expect(updateSingleConfiguration).toHaveBeenCalledWith(
      'tnt',
      'ext_categories',
      {
        key: 'ext_categories',
        value: { table: { columns, mixins: [] } },
      }
    )
    // The saved preference is read back.
    expect(fetchBasicConfiguration).toHaveBeenCalledTimes(2)
  })
})
