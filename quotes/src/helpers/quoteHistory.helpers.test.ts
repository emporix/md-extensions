import { describe, expect, test } from 'vitest'
import type { QuoteHistoryEntry } from '@emporix/api-calls/next'
import {
  buildQuoteHistoryRows,
  toQuoteStatusHistoryRows,
} from './quoteHistory.helpers'

const quote = {
  id: 'Q1',
  customer: { firstName: 'Anna', lastName: 'Morales' },
  metadata: { createdAt: '2026-11-27T10:00:00.000Z' },
}

const statusEntry = (over: Partial<QuoteHistoryEntry> = {}) =>
  ({
    id: 'h1',
    op: 'REPLACE',
    path: '/status',
    newValue: { value: 'OPEN', comment: 'here is the quote' },
    userFirstName: 'Markus',
    userLastName: 'Wellner',
    userType: 'EMPLOYEE',
    modifiedAt: '2026-11-27T11:26:00.000Z',
    ...over,
  }) as QuoteHistoryEntry

describe('quote history rows', () => {
  test('keeps only the status changes', () => {
    const rows = toQuoteStatusHistoryRows([
      statusEntry(),
      statusEntry({ id: 'h2', path: '/items' }),
      statusEntry({ id: 'h3', path: '/comment' }),
    ])
    expect(rows.map((row) => row.id)).toEqual(['h1'])
  })

  test('names who changed it, with the user type', () => {
    const [row] = toQuoteStatusHistoryRows([statusEntry()])
    expect(row.changedBy).toBe('Markus Wellner (EMPLOYEE)')
    expect(row.status).toBe('OPEN')
    expect(row.comment).toBe('here is the quote')
  })

  test('carries the reason message of the new status', () => {
    const message = { en: 'Provided price too high' }
    const [row] = toQuoteStatusHistoryRows([
      statusEntry({
        newValue: {
          value: 'IN_PROGRESS',
          comment: 'Please give 10% discount',
          quoteReason: { code: 'PRICE', message },
        },
        userType: 'CUSTOMER',
      }),
    ])
    expect(row.reason).toEqual(message)
    expect(row.changedBy).toContain('(CUSTOMER)')
  })

  test('has no comment for a blank one', () => {
    const [row] = toQuoteStatusHistoryRows([
      statusEntry({ newValue: { value: 'OPEN', comment: '  ' } }),
    ])
    expect(row.comment).toBeUndefined()
  })

  test('lists the newest change first and the request last', () => {
    const rows = buildQuoteHistoryRows(quote, [
      statusEntry({ id: 'old', modifiedAt: '2026-11-27T11:00:00.000Z' }),
      statusEntry({ id: 'new', modifiedAt: '2026-11-27T12:00:00.000Z' }),
    ])
    expect(rows.map((row) => row.id)).toEqual(['new', 'old', 'created-Q1'])
    expect(rows[2]).toMatchObject({
      kind: 'created',
      changedBy: 'Anna Morales',
      date: '2026-11-27T10:00:00.000Z',
    })
  })

  test('shows the request alone for a quote without status changes', () => {
    expect(buildQuoteHistoryRows(quote, [])).toHaveLength(1)
  })
})
