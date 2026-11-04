import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getApiClient } from '@emporix/api-calls'
import { fetchLabelsPage } from './labels'

vi.mock('@emporix/api-calls', () => ({
  getApiClient: vi.fn(),
}))

describe('fetchLabelsPage', () => {
  const get = vi.fn()

  beforeEach(() => {
    get.mockReset()
    vi.mocked(getApiClient).mockReturnValue({ get } as never)
  })

  it('sends the query params and the UI language, and reads the total', async () => {
    get.mockResolvedValue({
      data: [{ id: 'sale', name: 'Sale' }],
      headers: { 'x-total-count': '64' },
    })

    const result = await fetchLabelsPage(
      { currentPage: 2, rows: 10, sortField: 'name', sortOrder: -1 },
      'de'
    )

    expect(get).toHaveBeenCalledWith('label/labels', {
      params: { pageNumber: 2, pageSize: 10, sort: 'name:DESC' },
      headers: { 'x-total-count': true, 'Accept-Language': 'de' },
    })
    expect(result).toEqual({
      values: [{ id: 'sale', name: 'Sale' }],
      totalRecords: 64,
    })
  })

  it('reports zero when the total header is missing', async () => {
    get.mockResolvedValue({ data: [], headers: {} })

    const result = await fetchLabelsPage({}, 'en')

    expect(result.totalRecords).toBe(0)
  })
})
