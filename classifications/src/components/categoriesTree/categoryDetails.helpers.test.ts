import { describe, expect, test } from 'vitest'
import { CategoryTree } from '../../models/Category.model'
import {
  CategoryDetailsForm,
  createCategoryDetailsForm,
  findPositionConflicts,
  getCategoryDetailsChanges,
  toCategoryDetailsForm,
  toNewCategory,
} from './categoryDetails.helpers'

const category = (
  id: string,
  position: number,
  extra: Partial<CategoryTree> = {}
): CategoryTree => ({
  id,
  position,
  published: true,
  localizedName: { en: id },
  ...extra,
})

const form = (
  values: Partial<CategoryDetailsForm> = {}
): CategoryDetailsForm => ({
  id: 'a',
  code: 'code',
  localizedName: { en: 'Name', de: 'Name DE' },
  localizedSlug: { en: 'name' },
  localizedDescription: undefined,
  published: true,
  position: 2,
  ...values,
})

describe('toCategoryDetailsForm', () => {
  test('takes the editable fields of a category', () => {
    const tree = category('a', 3, {
      code: 'A',
      localizedSlug: { en: 'a' },
      localizedDescription: { en: 'About a' },
      subcategories: [category('a1', 0)],
    })
    expect(toCategoryDetailsForm(tree)).toEqual({
      id: 'a',
      code: 'A',
      localizedName: { en: 'a' },
      localizedSlug: { en: 'a' },
      localizedDescription: { en: 'About a' },
      published: true,
      position: 3,
    })
  })

  test('uses an empty code when the category has none', () => {
    expect(toCategoryDetailsForm(category('a', 0)).code).toBe('')
  })
})

describe('createCategoryDetailsForm', () => {
  test('starts empty, without a position', () => {
    expect(createCategoryDetailsForm(false)).toEqual({
      id: '',
      code: '',
      published: false,
      position: null,
    })
  })

  test('takes the given publication state', () => {
    expect(createCategoryDetailsForm(true).published).toBe(true)
  })
})

describe('toNewCategory', () => {
  test('takes the entered fields', () => {
    expect(
      toNewCategory(
        form({ id: 'shoes', localizedDescription: { en: 'All shoes' } })
      )
    ).toEqual({
      id: 'shoes',
      code: 'code',
      localizedName: { en: 'Name', de: 'Name DE' },
      localizedSlug: { en: 'name' },
      localizedDescription: { en: 'All shoes' },
      published: true,
    })
  })

  test('leaves out an empty id and code', () => {
    const newCategory = toNewCategory(form({ id: '  ', code: '' }))
    expect(newCategory).not.toHaveProperty('id')
    expect(newCategory).not.toHaveProperty('code')
  })

  test('trims the id', () => {
    expect(toNewCategory(form({ id: ' shoes ' })).id).toBe('shoes')
  })

  test('does not send a position', () => {
    expect(toNewCategory(form({ position: 4 }))).not.toHaveProperty('position')
  })
})

describe('getCategoryDetailsChanges', () => {
  test('returns nothing when no field changed', () => {
    expect(getCategoryDetailsChanges(form(), form())).toEqual({})
  })

  test('returns only the changed fields', () => {
    expect(
      getCategoryDetailsChanges(form(), form({ code: 'new', position: 7 }))
    ).toEqual({ code: 'new', position: 7 })
  })

  test('sends a changed localized field with all of its languages', () => {
    const values = form({ localizedName: { en: 'Renamed', de: 'Name DE' } })
    expect(getCategoryDetailsChanges(form(), values)).toEqual({
      localizedName: { en: 'Renamed', de: 'Name DE' },
    })
  })

  test('sends a cleared localized field as an empty map', () => {
    expect(
      getCategoryDetailsChanges(form(), form({ localizedSlug: undefined }))
    ).toEqual({ localizedSlug: {} })
  })

  test('treats a missing and an empty localized field as equal', () => {
    expect(
      getCategoryDetailsChanges(form(), form({ localizedDescription: {} }))
    ).toEqual({})
  })

  test('sends the publication state when it was toggled', () => {
    expect(
      getCategoryDetailsChanges(form(), form({ published: false }))
    ).toEqual({ published: false })
  })

  test('skips a cleared position', () => {
    expect(getCategoryDetailsChanges(form(), form({ position: null }))).toEqual(
      {}
    )
  })

  test('does not mutate its inputs', () => {
    const initial = form()
    const values = form({ code: 'new', localizedSlug: undefined })
    const originals = JSON.parse(JSON.stringify([initial, values]))
    getCategoryDetailsChanges(initial, values)
    expect(JSON.parse(JSON.stringify([initial, values]))).toEqual(originals)
  })
})

describe('findPositionConflicts', () => {
  const siblings = [category('a', 0), category('b', 1), category('c', 1)]

  test('returns the other siblings with the same position', () => {
    expect(findPositionConflicts(siblings, 'b', 1).map(({ id }) => id)).toEqual(
      ['c']
    )
  })

  test('returns nothing for a free position or no position', () => {
    expect(findPositionConflicts(siblings, 'a', 2)).toEqual([])
    expect(findPositionConflicts(siblings, 'a', null)).toEqual([])
  })
})
