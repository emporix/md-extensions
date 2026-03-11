import { describe, expect, it } from 'vitest'
import {
  ApiError,
  buildHeaders,
  buildPaginationParams,
  buildRestrictionQuery,
  ensureApiContext,
  extractTotalCount,
  normalizeISOEnd,
  normalizeISOStart,
  parseCollectionResponse,
  toApiError,
} from './base.api'

describe('base.api helpers', () => {
  it('parses collection response in multiple formats', () => {
    const fromArray = parseCollectionResponse<{ id: string }>([{ id: '1' }])
    expect(fromArray).toEqual([{ id: '1' }])

    const fromContent = parseCollectionResponse<{ id: string }>({
      content: [{ id: '2' }],
    })
    expect(fromContent).toEqual([{ id: '2' }])

    const fromItems = parseCollectionResponse<{ id: string }>({
      items: [{ id: '3' }],
    })
    expect(fromItems).toEqual([{ id: '3' }])

    const fromInvalid = parseCollectionResponse<{ id: string }>({
      data: 'invalid',
    })
    expect(fromInvalid).toEqual([])
  })

  it('extracts total count from header and body fallbacks', () => {
    const totalHeaderResponse = new Response(null, {
      headers: {
        'X-Total-Count': '42',
      },
    })
    expect(extractTotalCount(totalHeaderResponse)).toBe(42)

    const bodyFallbackResponse = new Response(null)
    expect(extractTotalCount(bodyFallbackResponse, { totalElements: 10 })).toBe(
      10
    )
    expect(extractTotalCount(bodyFallbackResponse, { total: 15 })).toBe(15)
    expect(extractTotalCount(bodyFallbackResponse, { total: '15' })).toBeNull()
  })

  it('builds shared api headers', () => {
    const headers = buildHeaders({
      tenant: 'tenant-a',
      token: 'token-a',
      includeTotalCount: true,
      contentType: 'application/json',
    }) as Record<string, string>

    expect(headers.Authorization).toBe('Bearer token-a')
    expect(headers['Emporix-Tenant']).toBe('tenant-a')
    expect(headers['X-Total-Count']).toBe('true')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('throws when required api context is missing', () => {
    expect(() => ensureApiContext('', 'tenant', 'token')).toThrow(
      'Missing API base URL, tenant, or token'
    )
    expect(() => ensureApiContext('https://api', '', 'token')).toThrow(
      'Missing API base URL, tenant, or token'
    )
    expect(() => ensureApiContext('https://api', 'tenant', '')).toThrow(
      'Missing API base URL, tenant, or token'
    )
  })

  it('does not throw when required api context is present', () => {
    expect(() =>
      ensureApiContext('https://api', 'tenant', 'token')
    ).not.toThrow()
  })

  it('normalizes ISO start date', () => {
    expect(normalizeISOStart('2024-01-01')).toBe('2024-01-01T00:00:00.000Z')
    expect(normalizeISOStart('2024-01-01T12:00:00Z')).toBe(
      '2024-01-01T12:00:00Z'
    )
  })

  it('normalizes ISO end date', () => {
    expect(normalizeISOEnd('2024-01-31')).toBe('2024-01-31T23:59:59.999Z')
    expect(normalizeISOEnd('2024-01-31T23:59:59Z')).toBe('2024-01-31T23:59:59Z')
  })

  it('builds restriction query', () => {
    expect(buildRestrictionQuery('site-a')).toBe('restriction:site-a')
  })

  it('builds pagination params with defaults', () => {
    const params = buildPaginationParams({})
    expect(params.get('pageNumber')).toBe('1')
    expect(params.get('pageSize')).toBe('50')
    expect(params.has('sort')).toBe(false)
  })

  it('builds pagination params with custom values', () => {
    const params = buildPaginationParams({
      pageNumber: 3,
      pageSize: 25,
      sort: 'name:ASC',
      fields: 'id,name',
    })
    expect(params.get('pageNumber')).toBe('3')
    expect(params.get('pageSize')).toBe('25')
    expect(params.get('sort')).toBe('name:ASC')
    expect(params.get('fields')).toBe('id,name')
  })

  it('ApiError carries status and is instanceof Error', () => {
    const err = new ApiError(409, 'Conflict')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(409)
    expect(err.message).toBe('Conflict')
    expect(err.name).toBe('ApiError')
  })

  it('toApiError returns ApiError with correct status', () => {
    const err = toApiError(new Response(null, { status: 409 }), 'create')
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(409)
    expect(err.message).toBe('Failed to create (409)')
  })

  it('toApiError returns specific messages for known status codes', () => {
    expect(
      toApiError(new Response(null, { status: 401 }), 'test').message
    ).toBe('Unauthorized')
    expect(
      toApiError(new Response(null, { status: 403 }), 'test').message
    ).toBe('Access denied')
    expect(
      toApiError(new Response(null, { status: 404 }), 'test').message
    ).toBe('Resource not found')
    expect(
      toApiError(new Response(null, { status: 429 }), 'test').message
    ).toBe('Too many requests — please try again later')
  })

  it('toApiError returns generic message for unknown status', () => {
    expect(
      toApiError(new Response(null, { status: 500 }), 'load data').message
    ).toBe('Failed to load data (500)')
  })
})
