import { describe, expect, it } from 'vitest'
import { FilterMatchMode } from 'primereact/api'
import {
  clearNamespacedListParams,
  fromDateParam,
  getFilterValue,
  getLogListAgentId,
  getNamespacedListKey,
  parseLogListQuery,
  toDateParam,
  writeNamespacedParams,
} from './logListQuery.helpers'

describe('logListQuery.helpers', () => {
  it('parses empty search as defaults', () => {
    const parsed = parseLogListQuery('')

    expect(parsed.agentId).toBeUndefined()
    expect(parsed.requests.sortField).toBe('lastActivity')
    expect(parsed.requests.sortOrder).toBe(-1)
    expect(parsed.requests.apiSortBy).toBe('metadata.createdAt')
    expect(parsed.requests.rows).toBe(10)
    expect(parsed.requests.apiFilters).toEqual({})
    expect(parsed.jobs.sortField).toBe('createdAt')
    expect(parsed.sessions.sortField).toBe('metadata.modifiedAt')
    expect(parsed.requests.filters.severity).toEqual({
      value: null,
      matchMode: FilterMatchMode.EQUALS,
    })
  })

  it('round-trips filters, sort, and rows while preserving agentId', () => {
    const date = new Date(2026, 8, 17)
    const search = writeNamespacedParams('?agentId=scope-agent', 'r', {
      filters: {
        agentId: { value: 'col-agent', matchMode: FilterMatchMode.CONTAINS },
        requestId: { value: 'req-1', matchMode: FilterMatchMode.CONTAINS },
        sessionId: { value: null, matchMode: FilterMatchMode.CONTAINS },
        lastActivity: { value: date, matchMode: FilterMatchMode.CONTAINS },
        duration: { value: null, matchMode: FilterMatchMode.CONTAINS },
        severity: { value: 'ERROR', matchMode: FilterMatchMode.EQUALS },
      },
      sortField: 'severity',
      sortOrder: 1,
      rows: 25,
    })

    expect(getLogListAgentId(search)).toBe('scope-agent')
    expect(search).toContain('agentId=scope-agent')
    expect(search).toContain('r.requestId=req-1')
    expect(search).toContain('r.severity=ERROR')
    expect(search).toContain('r.sort=severity%3AASC')
    expect(search).toContain('r.rows=25')
    expect(search).not.toContain('r.sessionId=')

    const parsed = parseLogListQuery(search)
    expect(parsed.agentId).toBe('scope-agent')
    expect(getFilterValue(parsed.requests.filters, 'requestId')).toBe('req-1')
    expect(getFilterValue(parsed.requests.filters, 'severity')).toBe('ERROR')
    expect(
      toDateParam(
        getFilterValue(parsed.requests.filters, 'lastActivity') as Date
      )
    ).toBe('2026-09-17')
    expect(parsed.requests.sortField).toBe('severity')
    expect(parsed.requests.sortOrder).toBe(1)
    expect(parsed.requests.rows).toBe(25)
    expect(parsed.requests.apiFilters.severity).toBe('30')
    expect(parsed.requests.apiFilters.triggerAgentId).toBe('col-agent')
  })

  it('preserves other namespace params when writing jobs', () => {
    const withRequests = writeNamespacedParams('?agentId=a1', 'r', {
      filters: {
        requestId: { value: 'r1', matchMode: FilterMatchMode.CONTAINS },
      },
    })
    const withJobs = writeNamespacedParams(withRequests, 'j', {
      filters: {
        type: { value: 'IMPORT', matchMode: FilterMatchMode.EQUALS },
      },
      rows: 50,
    })

    const parsed = parseLogListQuery(withJobs)
    expect(parsed.agentId).toBe('a1')
    expect(getFilterValue(parsed.requests.filters, 'requestId')).toBe('r1')
    expect(getFilterValue(parsed.jobs.filters, 'type')).toBe('IMPORT')
    expect(parsed.jobs.apiFilters.type).toBe('import')
    expect(parsed.jobs.rows).toBe(50)
    expect(getNamespacedListKey(withJobs, 'r')).toContain('r.requestId=r1')
    expect(getNamespacedListKey(withJobs, 'j')).toContain('j.type=IMPORT')
  })

  it('omits empty filter values and default sort/rows', () => {
    const search = writeNamespacedParams('', 'r', {
      filters: {
        requestId: { value: '  ', matchMode: FilterMatchMode.CONTAINS },
        severity: { value: null, matchMode: FilterMatchMode.EQUALS },
      },
      sortField: 'lastActivity',
      sortOrder: -1,
      rows: 10,
    })

    expect(search).toBe('')
  })

  it('ignores invalid date and rows', () => {
    const parsed = parseLogListQuery(
      '?r.lastActivity=not-a-date&r.rows=15&r.sort=unknown:ASC'
    )

    expect(getFilterValue(parsed.requests.filters, 'lastActivity')).toBeNull()
    expect(parsed.requests.rows).toBe(10)
    expect(parsed.requests.sortField).toBe('lastActivity')
  })

  it('parses session date aliases', () => {
    const search = writeNamespacedParams('', 's', {
      filters: {
        'metadata.createdAt': {
          value: new Date(2026, 0, 5),
          matchMode: FilterMatchMode.CONTAINS,
        },
        'metadata.modifiedAt': {
          value: new Date(2026, 0, 6),
          matchMode: FilterMatchMode.CONTAINS,
        },
      },
      sortField: 'sessionId',
      sortOrder: 1,
    })

    expect(search).toContain('s.createdAt=2026-01-05')
    expect(search).toContain('s.modifiedAt=2026-01-06')
    expect(search).toContain('s.sort=sessionId%3AASC')

    const parsed = parseLogListQuery(search)
    expect(
      toDateParam(
        getFilterValue(parsed.sessions.filters, 'metadata.createdAt') as Date
      )
    ).toBe('2026-01-05')
    expect(parsed.sessions.apiSortBy).toBe('sessionId')
  })

  it('converts date params locally', () => {
    const date = fromDateParam('2026-09-17')
    expect(date).not.toBeNull()
    expect(toDateParam(date as Date)).toBe('2026-09-17')
    expect(fromDateParam('2026-13-40')).toBeNull()
  })

  it('clears namespaced list params but keeps agentId', () => {
    expect(
      clearNamespacedListParams(
        '?agentId=a1&r.severity=ERROR&j.type=IMPORT&s.rows=25'
      )
    ).toBe('?agentId=a1')
    expect(clearNamespacedListParams('')).toBe('')
    expect(clearNamespacedListParams('?agentId=scope')).toBe('?agentId=scope')
  })
})
