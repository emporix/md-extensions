import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteLabel, removeLabelImageFromCloudinary } from '@emporix/api-calls'
import {
  deleteLabelWithImage,
  filterVisibleColumns,
  toLabelsQueryParams,
} from './labels.helpers'
import type { Label } from '../models/Label.model'

vi.mock('@emporix/api-calls', () => ({
  deleteLabel: vi.fn(),
  removeLabelImageFromCloudinary: vi.fn(),
}))

const label: Label = {
  id: 'sale',
  name: 'Sale',
  image: 'https://res.cloudinary.test/sale.png',
}

describe('deleteLabelWithImage', () => {
  beforeEach(() => {
    vi.mocked(deleteLabel).mockResolvedValue(undefined)
    vi.mocked(removeLabelImageFromCloudinary).mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('removes the Cloudinary image before deleting the label', async () => {
    await deleteLabelWithImage(label)

    expect(removeLabelImageFromCloudinary).toHaveBeenCalledWith(label.image)
    expect(deleteLabel).toHaveBeenCalledOnce()
    expect(deleteLabel).toHaveBeenCalledWith(label)
    expect(
      vi.mocked(removeLabelImageFromCloudinary).mock.invocationCallOrder[0]
    ).toBeLessThan(vi.mocked(deleteLabel).mock.invocationCallOrder[0])
  })

  it('only deletes the label when it has no image', async () => {
    await deleteLabelWithImage({ ...label, image: undefined })

    expect(removeLabelImageFromCloudinary).not.toHaveBeenCalled()
    expect(deleteLabel).toHaveBeenCalledOnce()
  })

  it('still deletes the label when removing the image fails', async () => {
    vi.mocked(removeLabelImageFromCloudinary).mockRejectedValue(
      new Error('cloudinary down')
    )

    await deleteLabelWithImage(label)

    expect(deleteLabel).toHaveBeenCalledOnce()
    expect(deleteLabel).toHaveBeenCalledWith(label)
  })

  it('rejects when deleting the label keeps failing', async () => {
    vi.mocked(deleteLabel).mockRejectedValue(new Error('api down'))

    await expect(deleteLabelWithImage(label)).rejects.toThrow('api down')
    expect(deleteLabel).toHaveBeenCalledTimes(2)
  })
})

describe('filterVisibleColumns', () => {
  const columns = [{ field: 'image' }, { field: 'name' }]

  it('shows every column when nothing was saved', () => {
    expect(filterVisibleColumns(columns, [])).toEqual(columns)
  })

  it('hides the columns saved as not visible', () => {
    expect(
      filterVisibleColumns(columns, [
        { key: 'image', visible: false },
        { key: 'name', visible: true },
      ])
    ).toEqual([{ field: 'name' }])
  })

  it('keeps an explicitly empty selection empty', () => {
    expect(
      filterVisibleColumns(columns, [
        { key: 'image', visible: false },
        { key: 'name', visible: false },
      ])
    ).toEqual([])
  })

  it('shows columns that have no saved entry', () => {
    expect(
      filterVisibleColumns(columns, [{ key: 'image', visible: false }])
    ).toEqual([{ field: 'name' }])
  })
})

describe('toLabelsQueryParams', () => {
  it('sends paging only when there is no sort or search', () => {
    expect(toLabelsQueryParams({ currentPage: 2, rows: 25 })).toEqual({
      pageNumber: 2,
      pageSize: 25,
    })
  })

  it('defaults paging to the first page of 10', () => {
    expect(toLabelsQueryParams({})).toEqual({ pageNumber: 1, pageSize: 10 })
  })

  it('maps the sort order to ASC and DESC', () => {
    expect(toLabelsQueryParams({ sortField: 'name', sortOrder: 1 }).sort).toBe(
      'name:ASC'
    )
    expect(toLabelsQueryParams({ sortField: 'name', sortOrder: -1 }).sort).toBe(
      'name:DESC'
    )
  })

  it('searches the name through q', () => {
    expect(
      toLabelsQueryParams({
        filters: { name: { value: ' Sale ', matchMode: 'contains' } },
      }).q
    ).toBe('name:~(Sale)')
  })

  it('escapes regex characters in the search', () => {
    expect(
      toLabelsQueryParams({
        filters: { name: { value: 'a.b(c)', matchMode: 'contains' } },
      }).q
    ).toBe('name:~(a\\.b\\(c\\))')
  })

  it('skips q for an empty or cleared search', () => {
    expect(
      toLabelsQueryParams({
        filters: { name: { value: '  ', matchMode: 'contains' } },
      })
    ).not.toHaveProperty('q')
    expect(
      toLabelsQueryParams({
        filters: { name: { value: null, matchMode: 'contains' } },
      })
    ).not.toHaveProperty('q')
  })
})
