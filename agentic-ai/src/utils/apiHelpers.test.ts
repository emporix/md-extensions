import { describe, expect, it } from 'vitest'
import { parseCursorHeaders } from './apiHelpers'

describe('parseCursorHeaders', () => {
  it('reads next and prev cursors when present', () => {
    const headers = new Headers({
      'x-next-cursor': 'next-token',
      'x-prev-cursor': 'prev-token',
    })

    expect(parseCursorHeaders(headers)).toEqual({
      nextCursor: 'next-token',
      prevCursor: 'prev-token',
    })
  })

  it('returns null when cursor headers are missing', () => {
    expect(parseCursorHeaders(new Headers())).toEqual({
      nextCursor: null,
      prevCursor: null,
    })
  })

  it('reads mixed-case header names', () => {
    const headers = new Headers({
      'X-Next-Cursor': 'next-mixed',
      'X-Prev-Cursor': 'prev-mixed',
    })

    expect(parseCursorHeaders(headers)).toEqual({
      nextCursor: 'next-mixed',
      prevCursor: 'prev-mixed',
    })
  })
})
