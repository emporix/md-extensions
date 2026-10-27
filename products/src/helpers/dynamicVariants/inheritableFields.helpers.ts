import { Product } from '../../models/Category.model'

export const INHERITABLE_FIELDS: (keyof Product)[] = [
  'name',
  'published',
  'sellable',
  'brandId',
  'labelIds',
  'description',
  'media',
  'taxClasses',
  'relatedItems',
]

export function snapshotInheritedValues(
  product: Partial<Product>
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {}
  for (const field of INHERITABLE_FIELDS) {
    if (field in product) {
      snapshot[field] = product[field]
    }
  }
  return snapshot
}

/** Overridden fields already persisted on the product — for mixin-only saves. */
export const persistedOverriddenFields = (
  product: Partial<Product>
): Set<string> => new Set(product.metadata?.overridden ?? [])

export function stripInheritedFields(
  payload: Partial<Product>,
  overriddenFields: Set<string>,
  stripMixins = false
): Partial<Product> {
  const cleaned = { ...payload }
  for (const field of INHERITABLE_FIELDS) {
    if (!overriddenFields.has(field)) {
      delete cleaned[field]
    }
  }
  if (stripMixins && !overriddenFields.has('mixins')) {
    delete cleaned.mixins
    if (cleaned.metadata) {
      delete cleaned.metadata.mixins
    }
  }
  return cleaned
}
