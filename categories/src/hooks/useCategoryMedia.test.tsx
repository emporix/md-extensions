/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import {
  delAsset,
  downloadAsset,
  getAssetsForId,
  postFileAsset,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { DashboardProvider } from '../context/Dashboard.context'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import { useCategoryMedia } from './useCategoryMedia'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    getAssetsForId: vi.fn(),
    postFileAsset: vi.fn(),
    delAsset: vi.fn(),
    downloadAsset: vi.fn(),
  }
})

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const asset = (id: string) => ({
  id,
  details: { filename: `${id}.png` },
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <DashboardProvider
    appState={{
      tenant: 'tnt',
      token: '',
      language: 'en',
      contentLanguage: 'en',
      onError: () => undefined,
    }}
  >
    <RefreshValuesProvider>{children}</RefreshValuesProvider>
  </DashboardProvider>
)

// Scenario 8 (data side of the CL AssetsViewer / MediaAssetUpload)
describe('useCategoryMedia', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.mocked(getAssetsForId).mockResolvedValue([
      asset('a1'),
      asset('a2'),
    ] as never)
    vi.mocked(postFileAsset).mockResolvedValue({} as never)
    vi.mocked(delAsset).mockResolvedValue({} as never)
    vi.mocked(downloadAsset).mockRejectedValue(new Error('gone'))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads the assets of the category', async () => {
    const { result } = renderHook(() => useCategoryMedia('shoes'), { wrapper })

    await waitFor(() => expect(result.current.assets).toHaveLength(2))
    expect(getAssetsForId).toHaveBeenCalledWith('tnt', 'shoes')
  })

  it('uploads one file and reports its progress in percent', async () => {
    vi.mocked(postFileAsset).mockImplementation(
      async (_tenant, _file, onUploadProgress) => {
        onUploadProgress({ loaded: 1, total: 4 } as never)
        return {} as never
      }
    )
    const { result } = renderHook(() => useCategoryMedia('shoes'), { wrapper })
    const file = new File(['x'], 'shoe.png')
    const onProgress = vi.fn()

    await act(() => result.current.uploadAsset(file, onProgress))

    expect(postFileAsset).toHaveBeenCalledWith(
      'tnt',
      file,
      expect.any(Function),
      [{ id: 'shoes', type: 'CATEGORY' }],
      'PUBLIC'
    )
    expect(onProgress).toHaveBeenCalledWith(25)
  })

  it('removes the given assets', async () => {
    const { result } = renderHook(() => useCategoryMedia('shoes'), { wrapper })
    await waitFor(() => expect(result.current.assets).toHaveLength(2))

    await act(() => result.current.deleteAssets(result.current.assets))

    expect(delAsset).toHaveBeenCalledWith('tnt', 'a1')
    expect(delAsset).toHaveBeenCalledWith('tnt', 'a2')
    expect(toast.showSuccess).toHaveBeenCalledWith('2 images were deleted')
  })

  it('names a file that could not be downloaded', async () => {
    const { result } = renderHook(() => useCategoryMedia('shoes'), { wrapper })
    await waitFor(() => expect(result.current.assets).toHaveLength(2))

    await act(() => result.current.downloadAssets([asset('a2')]))

    expect(downloadAsset).toHaveBeenCalledWith('tnt', 'a2')
    expect(toast.showError).toHaveBeenCalledWith('Failed to download a2.png')
  })

  it('opens the dashboard media asset page', () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    const { result } = renderHook(() => useCategoryMedia('shoes'), { wrapper })

    result.current.openAsset(asset('a1'))

    expect(assign).toHaveBeenCalledWith('/media-assets/a1')
  })
})
