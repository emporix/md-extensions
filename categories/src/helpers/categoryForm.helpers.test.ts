import { describe, expect, test } from 'vitest'
import { Category, CategoryType } from '../models/Category.model'
import {
  CategoryFormFields,
  CategoryValidityType,
  createCategoryForm,
  getCategoryValidityType,
  mapCategoryFormToPayload,
  mapCategoryToForm,
} from './categoryForm.helpers'

const category = (extra: Partial<Category> = {}): Category =>
  ({
    id: 'shoes',
    parentId: 'clothes',
    code: 'SHO',
    localizedName: { en: 'Shoes' },
    localizedSlug: { en: 'shoes' },
    localizedDescription: { en: 'All shoes' },
    ecn: ['123'],
    position: 3,
    validity: {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T00:00:00.000Z',
    },
    published: true,
    type: CategoryType.STANDARD,
    mixins: { seo: { title: 'Shoes' } },
    metadata: { version: 7 },
    ...extra,
  }) as Category

const form = (
  values: Partial<CategoryFormFields> = {}
): CategoryFormFields => ({
  ...createCategoryForm(),
  localizedName: { en: 'Boots' },
  ...values,
})

describe('createCategoryForm', () => {
  test('starts empty and unpublished, without a position', () => {
    expect(createCategoryForm()).toEqual({
      id: '',
      code: '',
      ecn: [],
      position: null,
      validityFrom: '',
      validityTo: '',
      published: false,
    })
  })
})

describe('mapCategoryToForm', () => {
  test('takes the editable fields of a category', () => {
    expect(mapCategoryToForm(category())).toEqual({
      id: 'shoes',
      code: 'SHO',
      localizedName: { en: 'Shoes' },
      localizedSlug: { en: 'shoes' },
      localizedDescription: { en: 'All shoes' },
      ecn: ['123'],
      parentId: 'clothes',
      position: 3,
      validityFrom: '2026-01-01T00:00:00.000Z',
      validityTo: '2026-12-31T00:00:00.000Z',
      published: true,
    })
  })

  test('fills in what the category lacks', () => {
    const result = mapCategoryToForm(
      category({
        code: undefined,
        ecn: undefined,
        validity: undefined,
        position: undefined,
      } as unknown as Partial<Category>)
    )
    expect(result.code).toBe('')
    expect(result.ecn).toEqual([])
    expect(result.validityFrom).toBe('')
    expect(result.validityTo).toBe('')
    expect(result.position).toBeNull()
  })
})

describe('getCategoryValidityType', () => {
  test('is never for an unpublished category', () => {
    expect(getCategoryValidityType(category({ published: false }))).toBe(
      CategoryValidityType.NEVER
    )
  })

  test('is custom for a published category with dates', () => {
    expect(getCategoryValidityType(category())).toBe(
      CategoryValidityType.CUSTOM
    )
    expect(
      getCategoryValidityType(
        category({
          validity: { to: '2026-12-31T00:00:00.000Z' } as Category['validity'],
        })
      )
    ).toBe(CategoryValidityType.CUSTOM)
  })

  test('is always for a published category without dates', () => {
    expect(
      getCategoryValidityType(
        category({ validity: {} as Category['validity'] })
      )
    ).toBe(CategoryValidityType.ALWAYS)
  })
})

describe('mapCategoryFormToPayload', () => {
  test('puts the form on top of the loaded category for an update', () => {
    const loaded = category()
    const values = {
      ...mapCategoryToForm(loaded),
      code: 'BOO',
      localizedName: { en: 'Boots' },
      position: 5,
      published: false,
    }
    expect(mapCategoryFormToPayload(values, loaded)).toEqual({
      ...loaded,
      code: 'BOO',
      localizedName: { en: 'Boots' },
      position: 5,
      published: false,
    })
  })

  test('moves an updated category to the top level when the parent is cleared', () => {
    const loaded = category()
    const payload = mapCategoryFormToPayload(
      { ...mapCategoryToForm(loaded), parentId: undefined },
      loaded
    )
    expect(payload.parentId).toBeUndefined()
  })

  test('keeps the loaded position when the field is cleared', () => {
    const loaded = category()
    const payload = mapCategoryFormToPayload(
      { ...mapCategoryToForm(loaded), position: null },
      loaded
    )
    expect(payload.position).toBe(3)
  })

  test('sends only the dates that are set', () => {
    const loaded = category()
    const payload = mapCategoryFormToPayload(
      { ...mapCategoryToForm(loaded), validityFrom: '', validityTo: '' },
      loaded
    )
    expect(payload.validity).toEqual({})
  })

  test('creates a category with the default flags', () => {
    expect(
      mapCategoryFormToPayload(
        form({ id: ' boots ', code: 'BOO', parentId: 'shoes', position: 2 })
      )
    ).toEqual({
      navigation: false,
      index: false,
      id: 'boots',
      code: 'BOO',
      localizedName: { en: 'Boots' },
      ecn: [],
      parentId: 'shoes',
      position: 2,
      validity: {},
      published: false,
    })
  })

  test('leaves out an empty id, code and position of a new category', () => {
    const payload = mapCategoryFormToPayload(form())
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('code')
    expect(payload).not.toHaveProperty('position')
    expect(payload.parentId).toBeUndefined()
  })

  test('does not mutate its inputs', () => {
    const loaded = category()
    const values = mapCategoryToForm(loaded)
    const originals = JSON.parse(JSON.stringify([loaded, values]))
    mapCategoryFormToPayload({ ...values, code: 'NEW' }, loaded)
    expect(JSON.parse(JSON.stringify([loaded, values]))).toEqual(originals)
  })
})
