/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { FilterMatchMode } from '@emporix/component-library'
import { useQuotesApi } from './quotes'
import { stubApiClient, type StubbedRequest } from '../../test/apiClientStub'
import { QuoteEditOp } from '../../models/Quotes.model'
import type { PaginationProps } from '../usePagination'

const dashboard = vi.hoisted(() => ({ tenant: 'mytenant' as string | null }))
vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: dashboard.tenant }),
}))

/** The quotes list state on entry: newest first, ten rows. */
const listState: Partial<PaginationProps> = {
  currentPage: 1,
  rows: 10,
  first: 0,
  sortField: 'metadata.createdAt',
  sortOrder: -1,
}

const renderApi = () => renderHook(() => useQuotesApi()).result.current

describe('useQuotesApi on @emporix/api-calls/next', () => {
  let requests: StubbedRequest[]
  let response: { data?: unknown; headers?: Record<string, string> }

  beforeEach(() => {
    dashboard.tenant = 'mytenant'
    response = {}
    requests = stubApiClient(() => response)
  })

  it('lists the quotes of the site with the request MD sent', async () => {
    response = {
      data: [{ id: 'Q1' }, { id: 'Q2' }],
      headers: { 'x-total-count': '1204' },
    }

    const result = await renderApi().getQuotes(listState, 'main')

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: '/quote/mytenant/quotes',
      params: {
        pageNumber: 1,
        pageSize: 10,
        sort: 'metadata.createdAt:DESC',
        // MD sent `siteCode:main`; ./next quotes text values.
        q: 'siteCode:"main"',
      },
    })
    expect(requests[0].headers['X-Total-Count']).toBe('true')
    expect(result).toEqual({
      data: [{ id: 'Q1' }, { id: 'Q2' }],
      totalRecords: 1204,
    })
  })

  it('adds the table filters after the site, in MD query syntax', async () => {
    response = { data: [] }

    await renderApi().getQuotes(
      {
        ...listState,
        currentPage: 2,
        sortField: 'id',
        sortOrder: 1,
        filters: {
          'company.name': {
            value: 'Emporix (DE)',
            matchMode: FilterMatchMode.CONTAINS,
          },
          'status.value': {
            value: 'AWAITING',
            matchMode: FilterMatchMode.CONTAINS,
          },
          'totalPrice.grossValue': {
            value: { value: 100, mode: 'gt' },
            matchMode: FilterMatchMode.EQUALS,
          },
          id: { value: '', matchMode: FilterMatchMode.CONTAINS },
        },
      },
      'main'
    )

    expect(requests[0].params).toMatchObject({
      pageNumber: 2,
      pageSize: 10,
      sort: 'id:ASC',
      q: 'siteCode:"main" company.name:~(Emporix \\(DE\\)) status.value:~(AWAITING) totalPrice.grossValue:>100',
    })
  })

  it('loads one quote', async () => {
    response = { data: { id: 'Q1' } }

    await expect(renderApi().getQuoteById('Q1')).resolves.toEqual({
      id: 'Q1',
    })
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: '/quote/mytenant/quotes/Q1',
    })
  })

  it('creates a draft and resolves to its id, as MD did', async () => {
    response = { data: { id: 'Q9' } }
    const draft = {
      siteCode: 'main',
      currency: 'EUR',
      customerId: 'c1',
      legalEntityId: 'le1',
      shippingAddressId: 'a1',
      billingAddressId: 'a1',
      restriction: 'main',
    }

    await expect(renderApi().createQuote(draft)).resolves.toBe('Q9')
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/quote/mytenant/quotes',
      data: draft,
    })
  })

  it('patches with an array of operations, also for a single one', async () => {
    const api = renderApi()
    const items = [{ op: QuoteEditOp.add, path: '/items', value: { id: 'i' } }]
    const comment = {
      op: QuoteEditOp.replace,
      path: '/comment',
      value: { employeeComment: 'c' },
    }

    await api.updateQuote('Q1', items)
    await api.updateQuote('Q1', comment)

    expect(
      requests.map(({ method, url, data }) => [method, url, data])
    ).toEqual([
      ['PATCH', '/quote/mytenant/quotes/Q1', items],
      ['PATCH', '/quote/mytenant/quotes/Q1', [comment]],
    ])
  })

  it('changes the status with one REPLACE operation', async () => {
    await renderApi().changeQuoteStatus('Q1', {
      value: 'DECLINED_BY_MERCHANT',
      quoteReasonId: 'r1',
    })

    expect(requests[0]).toMatchObject({
      method: 'PATCH',
      url: '/quote/mytenant/quotes/Q1',
      data: [
        {
          op: 'REPLACE',
          path: '/status',
          value: { value: 'DECLINED_BY_MERCHANT', quoteReasonId: 'r1' },
        },
      ],
    })
  })

  it('deletes a quote', async () => {
    await renderApi().deleteQuote('Q1')

    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      url: '/quote/mytenant/quotes/Q1',
    })
  })

  it('generates the PDF with the empty body MD sent', async () => {
    await renderApi().getQuotePdf('Q1')

    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/quote/mytenant/quotes/Q1/pdf',
      data: {},
      responseType: 'blob',
    })
  })

  it('sends the quote to the customer with a bodiless POST', async () => {
    await renderApi().sendQuoteToCustomer('Q1')

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/quote/mytenant/quotes/Q1/send',
      headers: { 'Emporix-Tenant': 'mytenant' },
    })
    expect(requests[0].data).toBeUndefined()
  })

  it('does not send the quote without a tenant', async () => {
    dashboard.tenant = null

    await expect(renderApi().sendQuoteToCustomer('Q1')).rejects.toBe(
      'no config'
    )
    expect(requests).toHaveLength(0)
  })

  it('loads every reason in one page of 1000, as MD did', async () => {
    response = {
      data: [{ id: 'r1', type: 'DECLINE' }],
      headers: { 'x-total-count': '1' },
    }

    const result = await renderApi().getQuotesReasons()

    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: '/quote/mytenant/quote-reasons',
      params: { pageNumber: 1, pageSize: 1000 },
    })
    expect(result).toEqual({
      data: [{ id: 'r1', type: 'DECLINE' }],
      totalRecords: 1,
    })
  })

  it('loads the history of one quote as the array the endpoint returns', async () => {
    response = { data: [{ id: 'h1', path: '/status' }] }

    const result = await renderApi().getQuoteHistory('Q1')

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: '/quote/mytenant/quotes/Q1/history',
    })
    expect(result).toEqual([{ id: 'h1', path: '/status' }])
  })

  it('sends nothing without a tenant', async () => {
    dashboard.tenant = null
    const api = renderApi()

    await expect(api.getQuotes(listState, 'main')).rejects.toBe('no config')
    await expect(api.getQuoteById('Q1')).rejects.toBe('no config')
    await expect(api.getQuotesReasons()).rejects.toBe('no config')
    await expect(api.getQuoteHistory('Q1')).rejects.toBe('no config')
    expect(requests).toHaveLength(0)
  })
})
