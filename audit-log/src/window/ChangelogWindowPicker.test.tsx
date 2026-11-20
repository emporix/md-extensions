/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { TEST_LABELS, TEST_WINDOW } from '../test/changelogTestKit'
import {
  latestChangelogWindowEnd,
  type ChangelogWindow,
} from './changelogWindow'
import ChangelogWindowPicker from './ChangelogWindowPicker'

type CalendarProps = {
  value?: Date[]
  selectionMode?: string
  showTime?: boolean
  timeZone?: string
  dateFormat?: string
  label?: string
  onChange: (event: { value: (Date | null)[] }) => void
}

const calendar = vi.hoisted(() => ({
  props: undefined as CalendarProps | undefined,
}))

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  Calendar: (props: CalendarProps) => {
    calendar.props = props
    return <input data-testid="calendar-stub" />
  },
}))

const DAY_MS = 24 * 60 * 60 * 1000
const HINT = 'The period is limited to 7 days.'

describe('ChangelogWindowPicker', () => {
  let onChange: ReturnType<typeof vi.fn<(window: ChangelogWindow) => void>>

  const mount = () =>
    render(
      <ChangelogWindowPicker
        value={TEST_WINDOW}
        onChange={onChange}
        labels={TEST_LABELS}
        dateFormat="mm/dd/yy"
      />
    )
  const select = (dates: (Date | null)[]) =>
    act(() => calendar.props?.onChange({ value: dates }))

  beforeEach(() => {
    calendar.props = undefined
    onChange = vi.fn()
  })

  afterEach(cleanup)

  it('shows the window as a local date-time range', () => {
    mount()

    expect(calendar.props?.selectionMode).toBe('range')
    expect(calendar.props?.showTime).toBe(true)
    expect(calendar.props?.timeZone).toBeUndefined()
    expect(calendar.props?.dateFormat).toBe('mm/dd/yy')
    expect(calendar.props?.label).toBe('Period')
    expect(calendar.props?.value?.map((date) => date.toISOString())).toEqual([
      TEST_WINDOW.from.toISOString(),
      TEST_WINDOW.to.toISOString(),
    ])
  })

  it('waits for both ends before changing the window', () => {
    mount()

    select([new Date('2026-11-10T08:00:00Z'), null])

    expect(onChange).not.toHaveBeenCalled()
    expect(calendar.props?.value).toHaveLength(1)
  })

  it('passes a window of up to 7 days as picked, without a hint', () => {
    mount()
    const from = new Date('2026-11-10T08:00:00Z')
    const to = new Date('2026-11-12T20:00:00Z')

    select([from, to])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].from.toISOString()).toBe(
      from.toISOString()
    )
    expect(onChange.mock.calls[0][0].to.toISOString()).toBe(to.toISOString())
    expect(screen.queryByText(HINT)).toBeNull()
  })

  it('limits a longer selection to 7 days once and says so', () => {
    mount()
    const from = new Date('2026-11-01T08:00:00Z')

    select([from, new Date(from.getTime() + 10 * DAY_MS)])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].from).toEqual(from)
    expect(onChange.mock.calls[0][0].to).toEqual(latestChangelogWindowEnd(from))
    expect(screen.getByText(HINT)).toBeTruthy()
  })

  it('starts a new range at the start of the clicked local day', () => {
    mount()

    select([new Date(2026, 10, 10, 23, 59, 59, 999), null])

    expect(calendar.props?.value).toEqual([new Date(2026, 10, 10, 0, 0, 0, 0)])
  })

  it('ends a range picked by a second click at the end of that local day', () => {
    mount()
    select([new Date(2026, 10, 10, 23, 59, 59, 999), null])

    select([
      new Date(2026, 10, 10, 0, 0, 0, 0),
      new Date(2026, 10, 12, 0, 0, 0, 0),
    ])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].from).toEqual(
      new Date(2026, 10, 10, 0, 0, 0, 0)
    )
    expect(onChange.mock.calls[0][0].to).toEqual(
      new Date(2026, 10, 12, 23, 59, 59, 999)
    )
  })

  it('keeps the times the user sets on a complete range', () => {
    mount()
    const from = new Date(2026, 10, 10, 8, 30)
    const to = new Date(2026, 10, 12, 17, 15)

    select([from, to])

    expect(onChange.mock.calls[0][0].from).toEqual(from)
    expect(onChange.mock.calls[0][0].to).toEqual(to)
  })
})
