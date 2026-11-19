import { buildChangelogQ, type ChangelogFilter } from '@emporix/api-calls/next'

declare const changelogWindowBrand: unique symbol

/**
 * The time window an audit-log view pages in: two instants, at most 7 days
 * apart. Only `defaultChangelogWindow` and `limitChangelogWindow` make one.
 */
export type ChangelogWindow = {
  readonly from: Date
  readonly to: Date
  readonly [changelogWindowBrand]: true
}

export type LimitedChangelogWindow = {
  readonly window: ChangelogWindow
  /** The selection was longer than 7 days and was cut at 7 days from its start. */
  readonly limited: boolean
}

/** What a view filters by, besides the window. */
export type ChangelogScope = Omit<ChangelogFilter, 'occurredAt'>

const DEFAULT_WINDOW_DAYS = 3
const MAX_WINDOW_DAYS = 7

const toWindow = (from: Date, to: Date): ChangelogWindow =>
  ({
    from: new Date(from.getTime()),
    to: new Date(to.getTime()),
  }) as ChangelogWindow

/** The last 3 full UTC days, today included: 3 day partitions of the changelog table. */
export const defaultChangelogWindow = (now: Date): ChangelogWindow => {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()
  return toWindow(
    new Date(Date.UTC(year, month, day - (DEFAULT_WINDOW_DAYS - 1))),
    new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
  )
}

/**
 * The latest end of a window starting at `from`: 7 local calendar days later,
 * less 1 ms because the API includes both bounds. Across a DST change those
 * days are 167 or 169 hours.
 */
export const latestChangelogWindowEnd = (from: Date): Date => {
  const end = new Date(from.getTime())
  end.setDate(end.getDate() + MAX_WINDOW_DAYS)
  end.setMilliseconds(end.getMilliseconds() - 1)
  return end
}

export const limitChangelogWindow = (
  first: Date,
  second: Date
): LimitedChangelogWindow => {
  const [from, to] =
    first.getTime() <= second.getTime() ? [first, second] : [second, first]
  const latestEnd = latestChangelogWindowEnd(from)
  const limited = to.getTime() > latestEnd.getTime()
  return { window: toWindow(from, limited ? latestEnd : to), limited }
}

/** The `q` of a page: the scope, always bounded by the window as UTC instants. */
export const changelogWindowQ = (
  scope: ChangelogScope,
  window: ChangelogWindow
): string =>
  buildChangelogQ({
    ...scope,
    occurredAt: { kind: 'range', from: window.from, to: window.to },
  }) ?? ''
