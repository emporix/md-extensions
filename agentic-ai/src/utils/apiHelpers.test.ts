import { describe, expect, it } from 'vitest'
import { buildQueryParams, isUuid, parseCursorHeaders } from './apiHelpers'

const SAMPLE_UUID = '4c24c5cd-0b88-4d7a-ac9c-5a2293fd6399'

describe('isUuid', () => {
  it('accepts standard UUID strings', () => {
    expect(isUuid(SAMPLE_UUID)).toBe(true)
    expect(isUuid(`  ${SAMPLE_UUID}  `)).toBe(true)
  })

  it('rejects partial or invalid values', () => {
    expect(isUuid('4c24c5cd')).toBe(false)
    expect(isUuid('not-a-uuid')).toBe(false)
  })
})

describe('buildQueryParams', () => {
  it('uses exact match for UUID on uuidExactFields', () => {
    const query = buildQueryParams(
      {
        filters: { requestId: SAMPLE_UUID },
      },
      { uuidExactFields: ['requestId'] }
    )
    expect(query).toContain(`q=requestId%3A${SAMPLE_UUID}`)
    expect(query).not.toContain('~(')
  })

  it('uses contains for partial requestId even with uuidExactFields', () => {
    const query = buildQueryParams(
      {
        filters: { requestId: '4c24c5cd' },
      },
      { uuidExactFields: ['requestId'] }
    )
    expect(query).toContain('requestId%3A%7E%284c24c5cd%29')
  })

  it('uppercases exactMatchFields and leaves UUID case unchanged', () => {
    const query = buildQueryParams(
      {
        filters: { severity: 'error', requestId: SAMPLE_UUID },
      },
      {
        exactMatchFields: ['severity'],
        uuidExactFields: ['requestId'],
      }
    )
    expect(query).toContain('severity%3AERROR')
    expect(query).toContain(`requestId%3A${SAMPLE_UUID}`)
  })

  it('uses contains for UUID when uuidExactFields is not configured', () => {
    const query = buildQueryParams({
      filters: { sessionId: SAMPLE_UUID },
    })
    expect(query).toContain('sessionId%3A%7E%28')
  })
})

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
