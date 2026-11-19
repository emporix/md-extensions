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
import { MemoryRouter } from 'react-router'
import '../../translations/i18n'
import {
  limitChangelogWindow,
  type ChangelogScope,
  type ChangelogWindow,
} from '../../helpers/auditLog/changelogWindow.helpers'
import type { ChangelogCursorPage } from '../../hooks/useChangelogCursorPage'
import {
  changelogItem,
  cursorPageState,
  TEST_NOW,
  TEST_WINDOW,
} from '../../test/changelogTestKit'
import EntityChangelogTab from './EntityChangelogTab'

type PageOptions = { enabled?: boolean } | undefined

const pageStub = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useChangelogCursorPage', () => ({
  default: (
    scope: ChangelogScope,
    window: ChangelogWindow,
    rows: number,
    options: PageOptions
  ) => pageStub(scope, window, rows, options),
}))

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

vi.mock('./ChangelogWindowPicker', () => ({
  default: (props: PickerProps) => {
    mockPicker.props = props
    return <div data-testid="picker-stub">picker</div>
  },
}))

vi.mock('./ChangelogPaginator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ChangelogPaginator')>()
  const Paginator = actual.default
  return {
    default: (props: Parameters<typeof Paginator>[0]) => {
      mockPaginator.props = props
      return <Paginator {...props} />
    },
  }
})

const mockedPageStub = pageStub as ReturnType<
  typeof vi.fn<
    (
      scope: ChangelogScope,
      window: ChangelogWindow,
      rows: number,
      options: PageOptions
    ) => ChangelogCursorPage
  >
>

const mount = (props: { entityId?: string; isActive?: boolean } = {}) =>
  render(
    <MemoryRouter>
      <EntityChangelogTab
        entity="company"
        entityId={props.entityId ?? 'c1'}
        isActive={props.isActive ?? true}
      />
    </MemoryRouter>
  )

const lastRequest = () => mockedPageStub.mock.calls.at(-1)
const companyChanges = (...actors: string[]) =>
  actors.map((actor) => changelogItem('c1', { actor }))

describe('EntityChangelogTab', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TEST_NOW)
    mockedPageStub.mockReset().mockReturnValue(cursorPageState())
    mockPicker.props = undefined
    mockPaginator.props = undefined
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  afterAll(() => {
    if (previousTz === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = previousTz
    }
  })

  it('reads the entity it is given, in the default window, 10 rows at a time', () => {
    mount()

    expect(lastRequest()).toEqual([
      { entity: 'company', entityId: 'c1' },
      TEST_WINDOW,
      10,
      { enabled: true },
    ])
  })

  it.each([
    ['the tab is not selected', { isActive: false }],
    ['there is no entity id', { entityId: '' }],
  ])('reads nothing when %s', (_, props) => {
    mount(props)

    expect(lastRequest()?.[3]).toEqual({ enabled: false })
  })

  it('shows nothing while the tab is not selected', () => {
    const { container } = mount({ isActive: false })

    expect(container.textContent).toBe('')
  })

  it('heads the history with the period picker, showing the default window', () => {
    mount()

    expect(screen.getByTestId('picker-stub')).toBeTruthy()
    expect(mockPicker.props?.value).toEqual(TEST_WINDOW)
  })

  it('reads the period the user picks', () => {
    const period = limitChangelogWindow(
      new Date('2026-11-10T00:00:00.000Z'),
      new Date('2026-11-12T23:59:59.999Z')
    ).window
    mount()

    act(() => mockPicker.props?.onChange(period))

    expect(lastRequest()?.[1]).toEqual(period)
    expect(mockPicker.props?.value).toEqual(period)
  })

  it('reads the rows per page the user picks', () => {
    mockedPageStub.mockReturnValue(
      cursorPageState({ items: companyChanges('Ann'), nextCursor: 'n1' })
    )
    mount()

    act(() => mockPaginator.props?.onRowsChange(25))

    expect(lastRequest()?.[2]).toBe(25)
  })

  it('shows a spinner while the first page loads', () => {
    mockedPageStub.mockReturnValue(cursorPageState({ status: 'loading' }))

    mount()

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByText(/No audit log entries/)).toBeNull()
  })

  it('says there are no entries in the selected period', () => {
    mount()

    expect(
      screen.getByText('No audit log entries in the selected period')
    ).toBeTruthy()
    expect(screen.getByTestId('picker-stub')).toBeTruthy()
  })

  it('says the log could not be loaded and retries on request', () => {
    const state = cursorPageState({ status: 'error' })
    mockedPageStub.mockReturnValue(state)
    mount()

    expect(screen.getByText('The audit log could not be loaded.')).toBeTruthy()
    expect(screen.queryByText(/No audit log entries/)).toBeNull()

    fireEvent.click(screen.getByText('Try again'))

    expect(state.retry).toHaveBeenCalledTimes(1)
  })

  it('keeps the cards and offers Try again when a request fails', () => {
    const state = cursorPageState({
      status: 'error',
      items: companyChanges('Ann'),
    })
    mockedPageStub.mockReturnValue(state)
    mount()

    expect(screen.getByText('Ann')).toBeTruthy()

    fireEvent.click(screen.getByText('Try again'))

    expect(state.retry).toHaveBeenCalledTimes(1)
  })

  it('wires Previous and Next to the page', () => {
    const state = cursorPageState({
      items: companyChanges('Ann'),
      nextCursor: 'n1',
      prevCursor: 'p1',
    })
    mockedPageStub.mockReturnValue(state)
    mount()

    fireEvent.click(screen.getByTestId('changelog-paginator-previous'))
    fireEvent.click(screen.getByTestId('changelog-paginator-next'))

    expect(state.goPrev).toHaveBeenCalledTimes(1)
    expect(state.goNext).toHaveBeenCalledTimes(1)
  })

  it('shows changes unnumbered and in local time', () => {
    mockedPageStub.mockReturnValue(
      cursorPageState({
        items: [
          changelogItem('c1', { actor: 'Ann', at: '2026-11-18T10:00:00.000Z' }),
        ],
      })
    )

    const { container } = mount()

    expect(container.textContent).not.toMatch(/#\d/)
    expect(container.textContent).toContain('11:00')
    expect(container.textContent).not.toContain('10:00')
  })
})
