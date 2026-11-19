/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { CursorPaginatedResponse } from '@emporix/api-calls/next'
import {
  changelogWindowQ,
  defaultChangelogWindow,
  type ChangelogScope,
  type ChangelogWindow,
} from '../helpers/auditLog/changelogWindow.helpers'
import type { ChangelogItem } from '../models/Changelog.model'
import type { ChangelogCursor } from './api/changelog'
import { changelogPage as page, TEST_WINDOW } from '../test/changelogTestKit'
import useChangelogCursorPage from './useChangelogCursorPage'

type Page = CursorPaginatedResponse<ChangelogItem>

const getPage = vi.hoisted(() => vi.fn())
const dashboard = vi.hoisted(() => ({ tenant: 'tenant-a' }))
const mockGetPage = getPage as unknown as ReturnType<
  typeof vi.fn<
    (q: string, rows: number, cursor: ChangelogCursor) => Promise<Page>
  >
>

vi.mock('./api/changelog', () => ({
  useChangelogApi: () => ({ getChangelogCursorPage: getPage }),
}))

vi.mock('../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

const deferred = () => {
  let resolve: (value: Page) => void = () => undefined
  const promise = new Promise<Page>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

type Props = {
  scope: ChangelogScope
  window: ChangelogWindow
  rows: number
  enabled?: boolean
}

const EARLIER_WINDOW = defaultChangelogWindow(new Date('2026-11-10T12:00:00Z'))
const COMPANIES: ChangelogScope = { entity: 'company' }
const COMPANIES_Q = changelogWindowQ(COMPANIES, TEST_WINDOW)
const SITES: ChangelogScope = { entity: 'site' }
const SITES_Q = changelogWindowQ(SITES, TEST_WINDOW)
const BASE: Props = { scope: COMPANIES, window: TEST_WINDOW, rows: 10 }

const mount = (props: Props = BASE) =>
  renderHook(
    (p: Props) =>
      useChangelogCursorPage(p.scope, p.window, p.rows, { enabled: p.enabled }),
    { initialProps: props }
  )

const shownIds = (items: ChangelogItem[]) => items.map((e) => e.entityId)

describe('useChangelogCursorPage', () => {
  beforeEach(() => {
    mockGetPage.mockReset()
    dashboard.tenant = 'tenant-a'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [
      'without a tenant',
      () => {
        dashboard.tenant = ''
        return mount()
      },
    ],
    ['while disabled', () => mount({ ...BASE, enabled: false })],
  ])('sends nothing and stays idle %s', async (_, start) => {
    const { result } = start()
    await act(async () => undefined)

    expect(mockGetPage).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
    expect(result.current.items).toEqual([])
  })

  it('loads the first page with the scope, window and rows, and exposes the cursors', async () => {
    mockGetPage.mockResolvedValue(page(['c1', 'c2'], 'n1'))

    const { result } = mount({ ...BASE, rows: 25 })
    await act(async () => undefined)

    expect(mockGetPage).toHaveBeenCalledTimes(1)
    expect(mockGetPage).toHaveBeenCalledWith(
      changelogWindowQ(COMPANIES, TEST_WINDOW),
      25,
      {}
    )
    expect(result.current.status).toBe('ready')
    expect(shownIds(result.current.items)).toEqual(['c1', 'c2'])
    expect(result.current.nextCursor).toBe('n1')
    expect(result.current.prevCursor).toBeNull()
  })

  it('sends only the window when the scope is empty', async () => {
    mockGetPage.mockResolvedValue(page([]))

    mount({ ...BASE, scope: {} })
    await act(async () => undefined)

    expect(mockGetPage).toHaveBeenCalledWith(
      changelogWindowQ({}, TEST_WINDOW),
      10,
      {}
    )
  })

  it('follows next and prev with the cursors of the page shown', async () => {
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockResolvedValueOnce(page(['c2'], 'n2', 'p2'))
      .mockResolvedValueOnce(page(['c1'], 'n1'))
    const { result } = mount()
    await act(async () => undefined)

    await act(async () => result.current.goNext())
    expect(mockGetPage).toHaveBeenLastCalledWith(COMPANIES_Q, 10, {
      next: 'n1',
    })
    expect(shownIds(result.current.items)).toEqual(['c2'])
    expect(result.current.prevCursor).toBe('p2')

    await act(async () => result.current.goPrev())
    expect(mockGetPage).toHaveBeenLastCalledWith(COMPANIES_Q, 10, {
      prev: 'p2',
    })
    expect(shownIds(result.current.items)).toEqual(['c1'])
    expect(mockGetPage).toHaveBeenCalledTimes(3)
  })

  it('ignores next and prev without a cursor for that direction', async () => {
    mockGetPage.mockResolvedValue(page(['c1']))
    const { result } = mount()
    await act(async () => undefined)

    await act(async () => result.current.goNext())
    await act(async () => result.current.goPrev())

    expect(mockGetPage).toHaveBeenCalledTimes(1)
  })

  it('ignores a second next while the page is loading', async () => {
    const second = deferred()
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockReturnValueOnce(second.promise)
    const { result } = mount()
    await act(async () => undefined)

    await act(async () => result.current.goNext())
    expect(result.current.status).toBe('loading')
    await act(async () => result.current.goNext())

    expect(mockGetPage).toHaveBeenCalledTimes(2)
    await act(async () => second.resolve(page(['c2'], 'n2', 'p2')))
    expect(result.current.status).toBe('ready')
  })

  it.each([
    ['scope', { ...BASE, scope: SITES }, [SITES_Q, 10]],
    [
      'window',
      { ...BASE, window: EARLIER_WINDOW },
      [changelogWindowQ(COMPANIES, EARLIER_WINDOW), 10],
    ],
    ['rows', { ...BASE, rows: 25 }, [COMPANIES_Q, 25]],
  ] as const)(
    'goes back to the first page without the old cursor when the %s changes',
    async (_, next, [q, rows]) => {
      mockGetPage
        .mockResolvedValueOnce(page(['c1'], 'n1'))
        .mockResolvedValueOnce(page(['c2'], null, 'p2'))
        .mockResolvedValueOnce(page(['x1']))
      const { result, rerender } = mount()
      await act(async () => undefined)
      await act(async () => result.current.goNext())

      rerender({ ...next })
      await act(async () => undefined)

      expect(mockGetPage).toHaveBeenCalledTimes(3)
      expect(mockGetPage).toHaveBeenLastCalledWith(q, rows, {})
      expect(shownIds(result.current.items)).toEqual(['x1'])
    }
  )

  it('goes back to the first page without the old cursor when the tenant changes', async () => {
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockResolvedValueOnce(page(['c2'], null, 'p2'))
      .mockResolvedValueOnce(page(['x1']))
    const { result, rerender } = mount()
    await act(async () => undefined)
    await act(async () => result.current.goNext())

    dashboard.tenant = 'tenant-b'
    rerender({ ...BASE })
    await act(async () => undefined)

    expect(mockGetPage).toHaveBeenCalledTimes(3)
    expect(mockGetPage).toHaveBeenLastCalledWith(COMPANIES_Q, 10, {})
    expect(shownIds(result.current.items)).toEqual(['x1'])
  })

  it("never shows the previous query's page once the query changes", async () => {
    const sites = deferred()
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockReturnValueOnce(sites.promise)
    const { result, rerender } = mount()
    await act(async () => undefined)

    rerender({ ...BASE, scope: SITES })

    expect(result.current.items).toEqual([])
    expect(result.current.nextCursor).toBeNull()
    expect(result.current.status).toBe('loading')
  })

  it('loads the first page once when a page reached by cursor comes back empty', async () => {
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([]))
    const { result } = mount()
    await act(async () => undefined)

    await act(async () => result.current.goNext())
    await act(async () => undefined)

    expect(mockGetPage).toHaveBeenCalledTimes(3)
    expect(mockGetPage).toHaveBeenLastCalledWith(COMPANIES_Q, 10, {})
    expect(result.current.status).toBe('ready')
    expect(result.current.items).toEqual([])
  })

  it('drops a response that arrives after a newer request', async () => {
    const first = deferred()
    mockGetPage
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(page(['s1']))
    const { result, rerender } = mount()

    rerender({ ...BASE, scope: SITES })
    await act(async () => undefined)
    await act(async () => first.resolve(page(['c1'], 'n1')))

    expect(shownIds(result.current.items)).toEqual(['s1'])
    expect(result.current.nextCursor).toBeNull()
  })

  it('keeps the page shown when a request fails, and retry sends it again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPage
      .mockResolvedValueOnce(page(['c1'], 'n1'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(page(['c2'], null, 'p2'))
    const { result } = mount()
    await act(async () => undefined)

    await act(async () => result.current.goNext())

    expect(result.current.status).toBe('error')
    expect(shownIds(result.current.items)).toEqual(['c1'])

    await act(async () => result.current.retry())

    expect(mockGetPage).toHaveBeenCalledTimes(3)
    expect(mockGetPage).toHaveBeenLastCalledWith(COMPANIES_Q, 10, {
      next: 'n1',
    })
    expect(result.current.status).toBe('ready')
    expect(shownIds(result.current.items)).toEqual(['c2'])
  })
})
