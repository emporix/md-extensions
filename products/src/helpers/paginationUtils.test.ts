import { describe, expect, it, vi } from 'vitest'
import { clearFilterValues, fetchAllRecords } from './paginationUtils'

describe('clearFilterValues', () => {
  it('keeps every filter field and clears its value', () => {
    expect(
      clearFilterValues({
        name: { value: 'boiler', matchMode: 'contains' },
        id: { value: null, matchMode: 'contains' },
      })
    ).toEqual({
      name: { value: null, matchMode: 'contains' },
      id: { value: null, matchMode: 'contains' },
    })
  })

  it('does not change the given filters', () => {
    const filters = {
      name: { value: 'boiler', matchMode: 'contains' as const },
    }
    clearFilterValues(filters)
    expect(filters.name.value).toBe('boiler')
  })
})

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
})
