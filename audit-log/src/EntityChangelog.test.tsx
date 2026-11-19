/**
 * @vitest-environment jsdom
 */
// Central European time: 10:00Z must show as 11:00. Set before any Date is used.
const previousTz = vi.hoisted(() => {
  const before = process.env.TZ
  process.env.TZ = 'Europe/Berlin'
  return before
})

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  changelogItem,
  changelogPage,
  TEST_LABELS,
  TEST_NOW,
  TEST_WINDOW,
} from './test/changelogTestKit'
import {
  changelogWindowQ,
  limitChangelogWindow,
  type ChangelogWindow,
} from './window/changelogWindow'
import EntityChangelog from './EntityChangelog'
import type { FetchChangelogPage } from './paging/useChangelogCursorPage'

type PickerProps = {
  readonly value: ChangelogWindow
  readonly onChange: (window: ChangelogWindow) => void
}
type PaginatorProps = { readonly onRowsChange: (rows: number) => void }

const mockPicker = vi.hoisted(() => ({
  props: undefined as PickerProps | undefined,
}))
const mockPaginator = vi.hoisted(() => ({
  props: undefined as PaginatorProps | undefined,
}))

// The calendar of the component library does not work in jsdom
vi.mock('./window/ChangelogWindowPicker', () => ({
  default: (props: PickerProps) => {
    mockPicker.props = props
    return <div data-testid="picker-stub">picker</div>
  },
}))

vi.mock('./paging/ChangelogPaginator', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./paging/ChangelogPaginator')>()
  const Paginator = actual.default
  return {
    default: (props: Parameters<typeof Paginator>[0]) => {
      mockPaginator.props = props
      return <Paginator {...props} />
    },
  }
})

const fetchPage = vi.fn<FetchChangelogPage>()

type MountProps = { entityId?: string; enabled?: boolean; tenant?: string }

const mount = (props: MountProps = {}) =>
  render(
    <EntityChangelog
      entity="company"
      entityId={props.entityId ?? 'c1'}
      enabled={props.enabled ?? true}
      tenant={props.tenant ?? 't1'}
      fetchPage={fetchPage}
      labels={TEST_LABELS}
      locale="en"
      dateFormat="mm/dd/yy"
    />
  )

const settle = () => act(async () => undefined)
const mountSettled = async (props: MountProps = {}) => {
  const view = mount(props)
  await settle()
  return view
}

const COMPANY_Q = changelogWindowQ(
  { entity: 'company', entityId: 'c1' },
  TEST_WINDOW
)
const lastRequest = () => fetchPage.mock.calls[fetchPage.mock.calls.length - 1]
const companyChanges = (...actors: string[]) => ({
  ...changelogPage(['c1']),
  values: actors.map((actor) => changelogItem('c1', { actor })),
})

describe('EntityChangelog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TEST_NOW)
    fetchPage.mockReset().mockResolvedValue(changelogPage([]))
    mockPicker.props = undefined
    mockPaginator.props = undefined
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  afterAll(() => {
    if (previousTz === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = previousTz
    }
  })

  it('reads the entity it is given, in the default window, 10 rows at a time', async () => {
    await mountSettled()

    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(lastRequest()).toEqual([COMPANY_Q, 10, {}])
  })

  it.each([
    ['the tab is not selected', { enabled: false }],
    ['there is no entity id', { entityId: '' }],
    ['there is no tenant', { tenant: '' }],
  ])('reads nothing when %s', async (_, props) => {
    await mountSettled(props)

    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('shows nothing while the tab is not selected', async () => {
    const { container } = await mountSettled({ enabled: false })

    expect(container.textContent).toBe('')
  })

  it('heads the history with the period picker, showing the default window', async () => {
    await mountSettled()

    expect(screen.getByTestId('picker-stub')).toBeTruthy()
    expect(mockPicker.props?.value).toEqual(TEST_WINDOW)
  })

  it('reads the period the user picks', async () => {
    const period = limitChangelogWindow(
      new Date('2026-11-10T00:00:00.000Z'),
      new Date('2026-11-12T23:59:59.999Z')
    ).window
    await mountSettled()

    act(() => mockPicker.props?.onChange(period))
    await settle()

    expect(lastRequest()?.[0]).toBe(
      changelogWindowQ({ entity: 'company', entityId: 'c1' }, period)
    )
    expect(mockPicker.props?.value).toEqual(period)
  })

  it('reads the rows per page the user picks', async () => {
    fetchPage.mockResolvedValue(companyChanges('Ann'))
    await mountSettled()

    act(() => mockPaginator.props?.onRowsChange(25))
    await settle()

    expect(lastRequest()?.[1]).toBe(25)
  })

  it('shows a spinner while the first page loads', async () => {
    fetchPage.mockReturnValue(new Promise(() => undefined))

    await mountSettled()

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByText(/No audit log entries/)).toBeNull()
  })

  it('says there are no entries in the selected period', async () => {
    await mountSettled()

    expect(
      screen.getByText('No audit log entries in the selected period')
    ).toBeTruthy()
    expect(screen.getByTestId('picker-stub')).toBeTruthy()
  })

  it('says the log could not be loaded and retries on request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchPage.mockRejectedValueOnce(new Error('boom'))
    await mountSettled()

    expect(screen.getByText('The audit log could not be loaded.')).toBeTruthy()
    expect(screen.queryByText(/No audit log entries/)).toBeNull()

    fireEvent.click(screen.getByText('Try again'))
    await settle()

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(lastRequest()).toEqual([COMPANY_Q, 10, {}])
  })

  it('keeps the cards and offers Try again when a request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchPage
      .mockResolvedValueOnce({ ...companyChanges('Ann'), nextCursor: 'n1' })
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(companyChanges('Bob'))
    await mountSettled()

    fireEvent.click(screen.getByTestId('changelog-paginator-next'))
    await settle()

    expect(screen.getByText('Ann')).toBeTruthy()
    expect(screen.getByText('The audit log could not be loaded.')).toBeTruthy()

    fireEvent.click(screen.getByText('Try again'))
    await settle()

    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(lastRequest()).toEqual([COMPANY_Q, 10, { next: 'n1' }])
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('wires Previous and Next to the page', async () => {
    fetchPage.mockResolvedValue({
      ...companyChanges('Ann'),
      nextCursor: 'n1',
      prevCursor: 'p1',
    })
    await mountSettled()

    fireEvent.click(screen.getByTestId('changelog-paginator-previous'))
    await settle()
    expect(lastRequest()).toEqual([COMPANY_Q, 10, { prev: 'p1' }])

    fireEvent.click(screen.getByTestId('changelog-paginator-next'))
    await settle()
    expect(lastRequest()).toEqual([COMPANY_Q, 10, { next: 'n1' }])
  })

  it('shows changes unnumbered and in local time', async () => {
    fetchPage.mockResolvedValue({
      ...changelogPage([]),
      values: [
        changelogItem('c1', { actor: 'Ann', at: '2026-11-18T10:00:00.000Z' }),
      ],
    })

    const { container } = await mountSettled()

    expect(container.textContent).not.toMatch(/#\d/)
    expect(container.textContent).toContain('11:00')
    expect(container.textContent).not.toContain('10:00')
  })
})
