import { describe, expect, it } from 'vitest'
import {
  createCatalogForm,
  hasName,
  publishedToLabel,
  toCatalogPayload,
  type Catalog,
} from './Catalog.model'
import {
  filterVisibleCatalogColumns,
  type CatalogColumn,
} from '../hooks/useCatalogsTableColumns'

const loaded = {
  id: 'summer',
  code: 'summer-code',
  name: { en: 'Summer' },
  description: {},
  status: 'visible',
  categoryIds: ['cat-1'],
  publishedSites: ['main'],
  visibility: { visible: true, from: '2026-06-01T08:00:00.000Z', to: '' },
  metadata: { version: 3, createdAt: 'c', updatedAt: 'u' },
} as Catalog

describe('catalog form', () => {
  it('starts a new catalog not visible and without dates', () => {
    expect(createCatalogForm()).toEqual({
      id: '',
      name: {},
      description: {},
      categoryIds: [],
      publishedSites: [],
      visibleFrom: null,
      visibleTo: null,
      visible: false,
    })
  })

  it('treats an empty stored date as no date', () => {
    const form = createCatalogForm(loaded)
    expect(form.visibleFrom).toBe('2026-06-01T08:00:00.000Z')
    expect(form.visibleTo).toBeNull()
  })

  it('needs a name in at least one language', () => {
    expect(hasName(undefined)).toBe(false)
    expect(hasName({ en: ' ', de: '' })).toBe(false)
    expect(hasName({ en: '', de: 'Sommer' })).toBe(true)
  })
})

describe('catalog payload', () => {
  it('keeps the loaded fields the form does not edit and leaves out empty dates', () => {
    const payload = toCatalogPayload(createCatalogForm(loaded), loaded)

    expect(payload).toEqual({
      ...loaded,
      visibility: { visible: true, from: '2026-06-01T08:00:00.000Z' },
    })
  })

  it('takes the id of a new catalog from the form, trimmed, or leaves it out', () => {
    const form = { ...createCatalogForm(), name: { en: 'New' } }

    expect(toCatalogPayload({ ...form, id: ' new ' }).id).toBe('new')
    expect(toCatalogPayload(form)).not.toHaveProperty('id')
  })
})

describe('published to', () => {
  const count = (size: number) => `${size} site(s)`

  it('shows one code, a count for several, and a dash for none', () => {
    expect(publishedToLabel(['main'], count)).toBe('main')
    expect(publishedToLabel(['main', 'de'], count)).toBe('2 site(s)')
    expect(publishedToLabel([], count)).toBe('-')
    expect(publishedToLabel(undefined, count)).toBe('-')
  })
})

describe('column visibility', () => {
  const columns = [
    { key: 'status', field: 'status' },
    { key: 'name', field: 'name' },
    { key: 'lastPublished', field: 'metadata.updatedAt' },
  ] as CatalogColumn[]

  it('shows every column when nothing is saved as visible', () => {
    expect(
      filterVisibleCatalogColumns(columns, []).map((c) => c.field)
    ).toEqual(['status', 'name', 'metadata.updatedAt'])
  })

  it('shows only the columns whose MD key is saved as visible', () => {
    const shown = filterVisibleCatalogColumns(columns, ['lastPublished'])
    expect(shown.map((c) => c.field)).toEqual(['metadata.updatedAt'])
    expect(shown[0]).not.toHaveProperty('key')
  })
})
