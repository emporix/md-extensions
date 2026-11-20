/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type {
  ChangelogEntry,
  CursorPaginatedResponse,
} from '@emporix/api-calls/next'
import { changelogPage as page, TEST_WINDOW } from '../test/changelogTestKit'
import {
  changelogWindowQ,
  defaultChangelogWindow,
  type ChangelogScope,
  type ChangelogWindow,
} from '../window/changelogWindow'
import useChangelogCursorPage, {
  type FetchChangelogPage,
} from './useChangelogCursorPage'

type Page = CursorPaginatedResponse<ChangelogEntry>

const mockGetPage = vi.fn<FetchChangelogPage>()

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
  tenant?: string
  fetchPage?: FetchChangelogPage
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
      useChangelogCursorPage(p.scope, p.window, p.rows, {
        tenant: p.tenant ?? 'tenant-a',
        fetchPage: p.fetchPage ?? mockGetPage,
        enabled: p.enabled,
      }),
    { initialProps: props }
  )

const shownIds = (items: ChangelogEntry[]) => items.map((e) => e.entityId)

describe('useChangelogCursorPage', () => {
  beforeEach(() => {
    mockGetPage.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['without a tenant', () => mount({ ...BASE, tenant: '' })],
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

  it('sends nothing when only the identity of fetchPage changes', async () => {
    mockGetPage.mockResolvedValue(page(['c1'], 'n1'))
    const { result, rerender } = mount()
    await act(async () => undefined)

    rerender({
      ...BASE,
      fetchPage: (q, rows, cursor) => mockGetPage(q, rows, cursor),
    })
    await act(async () => undefined)
    rerender({
      ...BASE,
      fetchPage: (q, rows, cursor) => mockGetPage(q, rows, cursor),
    })
    await act(async () => undefined)

    expect(mockGetPage).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('ready')
    expect(shownIds(result.current.items)).toEqual(['c1'])
  })

  it('sends the next request through the fetchPage given last', async () => {
    mockGetPage.mockResolvedValue(page(['c1'], 'n1'))
    const latest = vi.fn<FetchChangelogPage>().mockResolvedValue(page(['c2']))
    const { result, rerender } = mount()
    await act(async () => undefined)

    rerender({ ...BASE, fetchPage: latest })
    await act(async () => result.current.goNext())

    expect(mockGetPage).toHaveBeenCalledTimes(1)
    expect(latest).toHaveBeenCalledWith(COMPANIES_Q, 10, { next: 'n1' })
    expect(shownIds(result.current.items)).toEqual(['c2'])
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

    rerender({ ...BASE, tenant: 'tenant-b' })
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
