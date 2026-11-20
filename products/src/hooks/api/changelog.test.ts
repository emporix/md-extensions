/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { listChangelogsWithCursorCall } from '@emporix/api-calls/next'
import { useChangelogApi } from './changelog'

const dashboard = vi.hoisted(() => ({ tenant: '' }))

vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

vi.mock('@emporix/api-calls/next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/api-calls/next')>()),
  listChangelogsWithCursorCall: vi.fn(),
}))

const changelogPage = (ids: string[], nextCursor: string | null = null) => ({
  values: ids.map((entityId) => ({
    at: '2026-11-18T10:00:00.000Z',
    type: 'update' as const,
    entity: 'company',
    entityId,
  })),
  nextCursor,
  prevCursor: null,
})

const listCall = vi.mocked(listChangelogsWithCursorCall)

const renderApi = (tenant: string) => {
  dashboard.tenant = tenant
  return renderHook(() => useChangelogApi())
}

describe('useChangelogApi', () => {
  beforeEach(() => {
    listCall.mockReset()
  })

  it('reads a page with the size, query and cursor for the tenant', async () => {
    const page = changelogPage(['c1'], 'n1')
    listCall.mockResolvedValue(page)
    const { result } = renderApi('tenant-a')

    const loaded = await result.current.getChangelogCursorPage(
      'entity:company',
      25,
      {
        next: 'n0',
      }
    )

    expect(loaded).toBe(page)
    expect(listCall).toHaveBeenCalledWith(
      { pageSize: 25, q: 'entity:company', next: 'n0' },
      { tenant: 'tenant-a' }
    )
  })

  it('sends no cursor for the first page', async () => {
    listCall.mockResolvedValue(changelogPage([]))
    const { result } = renderApi('tenant-a')

    await result.current.getChangelogCursorPage('q', 10, {})

    expect(listCall).toHaveBeenCalledWith(
      { pageSize: 10, q: 'q' },
      { tenant: 'tenant-a' }
    )
  })

  it('rejects without a tenant and sends nothing', async () => {
    const { result } = renderApi('')

    await expect(
      result.current.getChangelogCursorPage('q', 10, {})
    ).rejects.toThrow('No tenant')
    expect(listCall).not.toHaveBeenCalled()
  })
})
