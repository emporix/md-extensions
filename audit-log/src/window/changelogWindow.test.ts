import { afterAll, describe, expect, it, vi } from 'vitest'

// Central European time, with its DST changes, so a local-time mistake shows up
// as a wrong instant. Set before any Date is used in this file.
const previousTz = vi.hoisted(() => {
  const before = process.env.TZ
  process.env.TZ = 'Europe/Berlin'
  return before
})

afterAll(() => {
  if (previousTz === undefined) {
    delete process.env.TZ
  } else {
    process.env.TZ = previousTz
  }
})

import {
  changelogWindowQ,
  defaultChangelogWindow,
  latestChangelogWindowEnd,
  limitChangelogWindow,
} from './changelogWindow'

const DAY_MS = 24 * 60 * 60 * 1000

describe('test time zone', () => {
  it('runs in Central European time', () => {
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(-120)
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-60)
  })
})

describe('defaultChangelogWindow', () => {
  it('covers the last 3 full local days, ending with today', () => {
    // 15:00 in Berlin: 16 Nov 00:00 to 18 Nov 23:59:59.999 local time
    const window = defaultChangelogWindow(new Date('2026-11-18T14:00:00Z'))

    expect(window.from.toISOString()).toBe('2026-11-15T23:00:00.000Z')
    expect(window.to.toISOString()).toBe('2026-11-18T22:59:59.999Z')
  })

  it('uses the local day, not the UTC one, shortly after local midnight', () => {
    // 00:30 on 18 Nov in Berlin is still 17 Nov in UTC
    const window = defaultChangelogWindow(new Date('2026-11-17T23:30:00Z'))

    expect(window.from.toISOString()).toBe('2026-11-15T23:00:00.000Z')
    expect(window.to.toISOString()).toBe('2026-11-18T22:59:59.999Z')
  })

  it('starts and ends on local midnight across the autumn DST change', () => {
    // 24 Oct is summer time (UTC+2), 26 Oct winter time (UTC+1)
    const window = defaultChangelogWindow(new Date('2026-10-26T12:00:00Z'))

    expect(window.from.toISOString()).toBe('2026-10-23T22:00:00.000Z')
    expect(window.to.toISOString()).toBe('2026-10-26T22:59:59.999Z')
  })

  it('does not share its dates between calls', () => {
    const now = new Date('2026-11-18T14:00:00Z')
    const first = defaultChangelogWindow(now)

    first.from.setFullYear(2000)

    expect(defaultChangelogWindow(now).from.toISOString()).toBe(
      '2026-11-15T23:00:00.000Z'
    )
  })
})

describe('latestChangelogWindowEnd', () => {
  it('is 7 local calendar days after the start, less 1 ms', () => {
    const from = new Date(2026, 10, 1, 10, 0)

    expect(latestChangelogWindowEnd(from)).toEqual(
      new Date(2026, 10, 8, 9, 59, 59, 999)
    )
  })
})

describe('limitChangelogWindow', () => {
  const from = new Date('2026-11-01T10:00:00Z')

  it('keeps a window up to 7 days', () => {
    const to = new Date(from.getTime() + 7 * DAY_MS - 1)

    const limited = limitChangelogWindow(from, to)

    expect(limited.limited).toBe(false)
    expect(limited.window.from.toISOString()).toBe(from.toISOString())
    expect(limited.window.to.toISOString()).toBe(to.toISOString())
  })

  it.each([
    ['a longer window', 10 * DAY_MS],
    ['a window of exactly 7 days', 7 * DAY_MS],
  ])('cuts %s to 7 days from its start', (_, length) => {
    const limited = limitChangelogWindow(
      from,
      new Date(from.getTime() + length)
    )

    expect(limited.limited).toBe(true)
    expect(limited.window.to.getTime()).toBe(from.getTime() + 7 * DAY_MS - 1)
  })

  it('keeps 7 local calendar days across the autumn DST change', () => {
    // Central Europe leaves summer time on 2026-10-25, so these 7 days are 169 hours
    expect(new Date(2026, 9, 19).getTimezoneOffset()).toBe(-120)
    expect(new Date(2026, 9, 26).getTimezoneOffset()).toBe(-60)
    const autumnFrom = new Date(2026, 9, 19)
    const autumnTo = new Date(2026, 9, 25, 23, 59, 59, 999)

    const limited = limitChangelogWindow(autumnFrom, autumnTo)

    expect(autumnTo.getTime() - autumnFrom.getTime()).toBe(
      7 * DAY_MS - 1 + 3600000
    )
    expect(limited.limited).toBe(false)
    expect(limited.window.to.getTime()).toBe(autumnTo.getTime())
  })

  it('swaps a reversed selection', () => {
    const to = new Date('2026-11-03T10:00:00Z')

    const limited = limitChangelogWindow(to, from)

    expect(limited.window.from.toISOString()).toBe(from.toISOString())
    expect(limited.window.to.toISOString()).toBe(to.toISOString())
  })

  it('does not share the given dates', () => {
    const to = new Date('2026-11-03T10:00:00Z')

    const limited = limitChangelogWindow(from, to)
    to.setFullYear(2030)

    expect(limited.window.to.toISOString()).toBe('2026-11-03T10:00:00.000Z')
  })
})

describe('changelogWindowQ', () => {
  it('sends the window as UTC instants next to the scope', () => {
    // Instants picked in a UTC+1 browser; the request must carry the same instants
    const { window } = limitChangelogWindow(
      new Date('2026-11-16T10:00:00+01:00'),
      new Date('2026-11-18T12:30:00+01:00')
    )

    expect(
      changelogWindowQ({ entity: 'company', entityId: 'c1' }, window)
    ).toBe(
      'entity:company entityId:c1 occurredAt:(>="2026-11-16T09:00:00.000Z"+AND+<="2026-11-18T11:30:00.000Z")'
    )
  })

  it('always carries the window, also without a scope', () => {
    const window = defaultChangelogWindow(new Date('2026-11-18T14:00:00Z'))

    expect(changelogWindowQ({}, window)).toBe(
      'occurredAt:(>="2026-11-15T23:00:00.000Z"+AND+<="2026-11-18T22:59:59.999Z")'
    )
  })
})
