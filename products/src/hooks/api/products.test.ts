/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fetchProductCall } from '@emporix/api-calls'
import { useProductsApi } from './products'

vi.mock('@emporix/api-calls', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/api-calls')>()),
  fetchProductCall: vi.fn(),
}))
vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: 'test-tenant' }),
}))
vi.mock('../useLocalizedValue', () => ({
  useLocalizedValue: () => ({ createEmptyLocalized: () => ({}) }),
}))
vi.mock('./prices', () => ({
  usePriceApi: () => ({ fetchPricesToMap: vi.fn() }),
}))

const fetchProduct = vi.mocked(fetchProductCall)

describe('useProductsApi getOwnOverriddenPaths', () => {
  beforeEach(() => {
    fetchProduct.mockReset()
  })

  it('reads the raw product and returns its own override list', async () => {
    fetchProduct.mockResolvedValue({
      id: 'parent--blue',
      metadata: { overridden: ['description', 'mixins.qa'] },
    } as Awaited<ReturnType<typeof fetchProductCall>>)
    const { result } = renderHook(() => useProductsApi())

    const paths = await result.current.getOwnOverriddenPaths('parent--blue')

    expect(fetchProduct).toHaveBeenCalledWith('test-tenant', 'parent--blue', {
      rawValue: true,
    })
    expect(paths).toEqual(['description', 'mixins.qa'])
  })

  it('returns an empty list when the variant has no overrides', async () => {
    fetchProduct.mockResolvedValue({
      id: 'parent--blue',
      metadata: {},
    } as Awaited<ReturnType<typeof fetchProductCall>>)
    const { result } = renderHook(() => useProductsApi())

    await expect(
      result.current.getOwnOverriddenPaths('parent--blue')
    ).resolves.toEqual([])
  })
})
