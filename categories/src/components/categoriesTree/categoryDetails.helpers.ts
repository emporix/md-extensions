import { Category, CategoryTree } from '../../models/Category.model'
import type Localized from '../../models/Localized.model'

export interface CategoryDetailsForm {
  id: string
  code: string
  localizedName?: Localized
  localizedSlug?: Localized
  localizedDescription?: Localized
  published: boolean
  position: number | null
}

const LOCALIZED_FIELDS = [
  'localizedName',
  'localizedSlug',
  'localizedDescription',
] as const

export const toCategoryDetailsForm = (
  category: CategoryTree
): CategoryDetailsForm => ({
  id: category.id,
  code: category.code ?? '',
  localizedName: category.localizedName,
  localizedSlug: category.localizedSlug,
  localizedDescription: category.localizedDescription,
  published: category.published,
  position: category.position ?? null,
})

// The position of a new category follows from where it is added.
export const createCategoryDetailsForm = (
  published: boolean
): CategoryDetailsForm => ({
  id: '',
  code: '',
  published,
  position: null,
})

// The API generates the id when none is given.
export const toNewCategory = ({
  id,
  code,
  localizedName,
  localizedSlug,
  localizedDescription,
  published,
}: CategoryDetailsForm): Partial<Category> => ({
  ...(id.trim() ? { id: id.trim() } : {}),
  ...(code ? { code } : {}),
  localizedName,
  localizedSlug,
  localizedDescription,
  published,
})

const isSameLocalized = (a: Localized = {}, b: Localized = {}): boolean => {
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  )
}

// Only the edited fields go into the PATCH. It replaces a localized field as a
// whole, so a changed one is sent with all of its languages.
export const getCategoryDetailsChanges = (
  initial: CategoryDetailsForm,
  values: CategoryDetailsForm
): Partial<Category> => {
  const changes: Partial<Category> = {}
  if (values.code !== initial.code) {
    changes.code = values.code
  }
  LOCALIZED_FIELDS.forEach((field) => {
    if (!isSameLocalized(initial[field], values[field])) {
      changes[field] = values[field] ?? {}
    }
  })
  if (values.published !== initial.published) {
    changes.published = values.published
  }
  if (values.position !== null && values.position !== initial.position) {
    changes.position = values.position
  }
  return changes
}

// Siblings that share a position have no defined order between them.
export const findPositionConflicts = (
  siblings: CategoryTree[],
  categoryId: string,
  position: number | null
): CategoryTree[] =>
  position === null
    ? []
    : siblings.filter(
        (sibling) => sibling.id !== categoryId && sibling.position === position
      )
