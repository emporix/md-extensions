import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { fetchAllRecords } from './paginationUtils'

const httpError = (status: number) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status } as AxiosResponse
  )

const records = (count: number, from = 1) =>
  Array.from({ length: count }, (_, index) => ({ id: String(from + index) }))

describe('fetchAllRecords', () => {
  it('aggregates records across pages', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce({
        values: [{ id: '1' }, { id: '2' }],
        totalRecords: 3,
      })
      .mockResolvedValueOnce({
        values: [{ id: '3' }],
        totalRecords: 3,
      })

    const records = await fetchAllRecords(fetchFunction, {
      currentPage: 1,
      rows: 2,
    })

    expect(records).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }])
    expect(fetchFunction).toHaveBeenCalledTimes(2)
  })

  it('stops when a page returns no values', async () => {
    const fetchFunction = vi.fn().mockResolvedValue({
      values: [],
      totalRecords: 0,
    })

    const records = await fetchAllRecords(fetchFunction)

    expect(records).toEqual([])
    expect(fetchFunction).toHaveBeenCalledTimes(1)
  })

  it('retries failed requests and throws after max retries', async () => {
    const fetchFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))

    await expect(
      fetchAllRecords(
        fetchFunction,
        { currentPage: 1, rows: 10 },
        { maxRetries: 3, retryDelay: 0 }
      )
    ).rejects.toThrow('network')

    expect(fetchFunction).toHaveBeenCalledTimes(3)
  })

  it('keeps the records when the API lists fewer of them than it counts', async () => {
    // IAM users on stage: X-Total-Count 35, 34 records, page 2 answers 404.
    // One short page cannot tell an inflated count from a capped page size,
    // so page 2 is asked for once and its 404 ends the list.
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce({ values: records(34), totalRecords: 35 })
      .mockRejectedValue(httpError(404))

    const result = await fetchAllRecords(
      fetchFunction,
      { currentPage: 1, rows: 500 },
      { maxRetries: 3, retryDelay: 0 }
    )

    expect(result).toHaveLength(34)
    expect(fetchFunction).toHaveBeenCalledTimes(2)
  })

  it('does not request a page past X-Total-Count once the page size is known', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce({ values: records(500), totalRecords: 620 })
      .mockResolvedValueOnce({ values: records(119, 501), totalRecords: 620 })
      .mockRejectedValue(httpError(404))

    const result = await fetchAllRecords(fetchFunction, {
      currentPage: 1,
      rows: 500,
    })

    expect(result).toHaveLength(619)
    expect(fetchFunction).toHaveBeenCalledTimes(2)
    expect(fetchFunction).toHaveBeenLastCalledWith({
      currentPage: 2,
      rows: 500,
    })
  })

  it('fetches every page when the API caps the page size below the requested one', async () => {
    // 500 requested, 100 returned per page, 620 records
    const fetchFunction = vi.fn(
      async ({ currentPage = 1 }: { currentPage?: number }) => {
        const from = (currentPage - 1) * 100 + 1
        const count = Math.max(0, Math.min(100, 620 - from + 1))
        return { values: records(count, from), totalRecords: 620 }
      }
    )

    const result = await fetchAllRecords(fetchFunction, {
      currentPage: 1,
      rows: 500,
    })

    expect(result).toHaveLength(620)
    expect(result.at(-1)).toEqual({ id: '620' })
    expect(fetchFunction).toHaveBeenCalledTimes(7)
  })

  it('stops at the last counted page of a capped API with an inflated count', async () => {
    // 100 returned per page, 620 records, X-Total-Count 621
    const fetchFunction = vi.fn(
      async ({ currentPage = 1 }: { currentPage?: number }) => {
        if (currentPage > 7) {
          throw httpError(404)
        }
        const from = (currentPage - 1) * 100 + 1
        const count = Math.min(100, 620 - from + 1)
        return { values: records(count, from), totalRecords: 621 }
      }
    )

    const result = await fetchAllRecords(fetchFunction, {
      currentPage: 1,
      rows: 500,
    })

    expect(result).toHaveLength(620)
    expect(fetchFunction).toHaveBeenCalledTimes(7)
  })

  it('keeps the fetched records when a page past the last one answers 404', async () => {
    // A full page with an inflated count: the next page has to be asked for
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce({ values: records(2), totalRecords: 3 })
      .mockRejectedValue(httpError(404))

    const result = await fetchAllRecords(
      fetchFunction,
      { currentPage: 1, rows: 2 },
      { maxRetries: 3, retryDelay: 0 }
    )

    expect(result).toEqual([{ id: '1' }, { id: '2' }])
    expect(fetchFunction).toHaveBeenCalledTimes(2)
  })

  it('still fails when the first page answers 404', async () => {
    const fetchFunction = vi.fn().mockRejectedValue(httpError(404))

    await expect(
      fetchAllRecords(
        fetchFunction,
        { currentPage: 1, rows: 500 },
        { maxRetries: 3, retryDelay: 0 }
      )
    ).rejects.toThrow('Request failed with status code 404')

    expect(fetchFunction).toHaveBeenCalledTimes(3)
  })

  it('retries a later page that fails with something other than 404', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce({ values: records(2), totalRecords: 3 })
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce({ values: records(1, 3), totalRecords: 3 })

    const result = await fetchAllRecords(
      fetchFunction,
      { currentPage: 1, rows: 2 },
      { maxRetries: 3, retryDelay: 0 }
    )

    expect(result).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }])
    expect(fetchFunction).toHaveBeenCalledTimes(3)
  })
})
