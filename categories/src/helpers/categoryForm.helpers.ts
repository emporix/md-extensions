import { Category } from '../models/Category.model'
import type Localized from '../models/Localized.model'

export enum CategoryValidityType {
  ALWAYS = 'always',
  CUSTOM = 'custom',
  NEVER = 'never',
}

export interface CategoryFormFields {
  id: string
  code: string
  localizedName?: Localized
  localizedSlug?: Localized
  localizedDescription?: Localized
  ecn: string[]
  parentId?: string
  position: number | null
  validityFrom: string
  validityTo: string
  published: boolean
}

export const createCategoryForm = (): CategoryFormFields => ({
  id: '',
  code: '',
  ecn: [],
  position: null,
  validityFrom: '',
  validityTo: '',
  published: false,
})

export const mapCategoryToForm = (category: Category): CategoryFormFields => ({
  id: category.id,
  code: category.code ?? '',
  localizedName: category.localizedName,
  localizedSlug: category.localizedSlug,
  localizedDescription: category.localizedDescription,
  ecn: category.ecn ?? [],
  parentId: category.parentId,
  position: category.position ?? null,
  validityFrom: category.validity?.from ?? '',
  validityTo: category.validity?.to ?? '',
  published: category.published,
})

// An unpublished category reads as never valid, one with dates as custom.
export const getCategoryValidityType = (
  category: Category
): CategoryValidityType => {
  if (!category.published) {
    return CategoryValidityType.NEVER
  }
  return category.validity?.from || category.validity?.to
    ? CategoryValidityType.CUSTOM
    : CategoryValidityType.ALWAYS
}

// The flags new categories have always been created with.
const NEW_CATEGORY_DEFAULTS: Partial<Category> = {
  navigation: false,
  index: false,
}

// The update replaces the whole category, so the form goes on top of the
// loaded one. The API generates the id of a new category when none is given.
export const mapCategoryFormToPayload = (
  form: CategoryFormFields,
  category?: Category
): Partial<Category> => {
  const id = form.id.trim()
  return {
    ...(category ?? NEW_CATEGORY_DEFAULTS),
    ...(id ? { id } : {}),
    ...(category || form.code ? { code: form.code } : {}),
    localizedName: form.localizedName,
    localizedSlug: form.localizedSlug,
    localizedDescription: form.localizedDescription,
    ecn: form.ecn,
    parentId: form.parentId || undefined,
    ...(form.position !== null ? { position: form.position } : {}),
    validity: {
      ...(form.validityFrom ? { from: form.validityFrom } : {}),
      ...(form.validityTo ? { to: form.validityTo } : {}),
    } as Category['validity'],
    published: form.published,
  }
}
