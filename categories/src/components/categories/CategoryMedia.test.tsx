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
  within,
} from '@testing-library/react'
import { delAsset, getAssetsForId, postFileAsset } from '@emporix/api-calls'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import { RefreshValuesProvider } from '../../context/RefreshValuesProvider'
import CategoryMedia from './CategoryMedia'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

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

vi.mock('../../context/PermissionsProvider', () => ({
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

const asset = (id: string) => ({
  id,
  url: `https://cdn/${id}.png`,
  details: { filename: `${id}.png` },
})

const renderMedia = () =>
  render(
    <DashboardProvider
      appState={{
        tenant: 'tnt',
        token: '',
        language: 'en',
        contentLanguage: 'en',
        onError: () => undefined,
      }}
    >
      <RefreshValuesProvider>
        <CategoryMedia categoryId="shoes" />
      </RefreshValuesProvider>
    </DashboardProvider>
  )

// Scenario 8
describe('Category media tab', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    vi.mocked(getAssetsForId).mockResolvedValue([
      asset('a1'),
      asset('a2'),
    ] as never)
    vi.mocked(postFileAsset).mockResolvedValue({} as never)
    vi.mocked(delAsset).mockResolvedValue({} as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows the category assets', async () => {
    renderMedia()

    expect(await screen.findByTestId('category-assets-tile-a1')).toBeTruthy()
    expect(screen.getByTestId('category-assets-tile-a2')).toBeTruthy()
    expect(getAssetsForId).toHaveBeenCalledWith('tnt', 'shoes')
  })

  it('uploads a file as a category asset and reloads the list', async () => {
    renderMedia()
    await screen.findByTestId('category-assets-tile-a1')
    const input = screen
      .getByTestId('category-media-upload')
      .querySelector('input[type="file"]')
    if (!input) throw new Error('no file input')
    const file = new File(['png'], 'boot.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Upload' }))

    await waitFor(() =>
      expect(postFileAsset).toHaveBeenCalledWith(
        'tnt',
        file,
        expect.any(Function),
        [{ id: 'shoes', type: 'CATEGORY' }],
        'PUBLIC'
      )
    )
    await waitFor(() => expect(getAssetsForId).toHaveBeenCalledTimes(2))
  })

  it('shows the MD error toast when an upload fails', async () => {
    vi.mocked(postFileAsset).mockRejectedValue(new Error('too big'))
    renderMedia()
    await screen.findByTestId('category-assets-tile-a1')
    const input = screen
      .getByTestId('category-media-upload')
      .querySelector('input[type="file"]')
    if (!input) throw new Error('no file input')

    fireEvent.change(input, {
      target: { files: [new File(['png'], 'boot.png', { type: 'image/png' })] },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Upload' }))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while uploading assets',
        undefined
      )
    )
  })

  it('deletes the selected assets after confirmation', async () => {
    renderMedia()
    const tile = await screen.findByTestId('category-assets-tile-a1')

    fireEvent.click(within(tile).getByRole('checkbox'))
    fireEvent.click(screen.getByTestId('category-assets-delete'))
    const confirm = await screen.findByRole('dialog')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Yes' }))

    await waitFor(() => expect(delAsset).toHaveBeenCalledWith('tnt', 'a1'))
    expect(delAsset).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('1 images were deleted')
    )
    await waitFor(() => expect(getAssetsForId).toHaveBeenCalledTimes(2))
  })

  it('opens the dashboard media asset page from a preview', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    renderMedia()

    fireEvent.click(await screen.findByTestId('category-assets-preview-a2'))

    expect(assign).toHaveBeenCalledWith('/media-assets/a2')
  })

  // Requirement 11
  it('keeps upload and delete unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    renderMedia()
    const tile = await screen.findByTestId('category-assets-tile-a1')

    expect(
      (within(tile).getByRole('checkbox') as HTMLInputElement).disabled
    ).toBe(true)
    expect(
      (screen.getByTestId('category-assets-delete') as HTMLButtonElement)
        .disabled
    ).toBe(true)
    expect(
      (
        screen
          .getByTestId('category-media-upload')
          .querySelector('input[type="file"]') as HTMLInputElement
      ).disabled
    ).toBe(true)
  })
})
