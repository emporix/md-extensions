import { deepClone } from './utils'
import { Product, ProductType } from '../models/Category.model'

/**
 * Shared cleanup for both child and sibling drafts: removes identity
 * and server-owned fields, sets parentVariantId and productType.
 */
function cleanDraftBase(
  cloned: Partial<Product>,
  parentVariantId: string
): void {
  delete cloned.id
  delete cloned.yrn

  delete cloned.variants
  delete cloned.parentVariantPath
  delete cloned.template
  delete (cloned as Partial<Product> & { variantAttributes?: unknown })
    .variantAttributes

  cloned.parentVariantId = parentVariantId
  cloned.productType = ProductType.dynamicVariant

  if (cloned.metadata) {
    delete cloned.metadata.createdAt
    delete cloned.metadata.modifiedAt
  }

  cloned.metadata = cloned.metadata ?? { mixins: {} }
  if (cloned.metadata.mixins === undefined) {
    cloned.metadata.mixins = {}
  }
}

/**
 * Draft for "Add child": copy parent's fields so the form displays
 * inherited values, but on save non-overridden fields will be stripped
 * so the backend treats them as inherited.
 *
 * Parent's ownVariantAttributes become the child's inheritedVariantAttributes;
 * the child starts with empty ownVariantAttributes.
 */
export function buildDynamicVariantChildDraft(
  parent: Product,
  parentVariantId: string
): Partial<Product> {
  const cloned = deepClone(parent) as Partial<Product>
  cleanDraftBase(cloned, parentVariantId)

  cloned.inheritedVariantAttributes = {
    ...(parent.inheritedVariantAttributes ?? {}),
    ...(parent.ownVariantAttributes ?? {}),
  }
  cloned.ownVariantAttributes = {}

  // Clear parent's overridden list — child starts with no overrides
  if (cloned.metadata) {
    delete cloned.metadata.overridden
  }

  cloned.mixins = cloned.mixins ?? {}

  return cloned
}

/**
 * Draft for "Add sibling": clone the clicked sibling so the user gets
 * the same overrides. ownVariantAttributes are copied as-is (not
 * converted to inherited), since this is a copy, not inheritance.
 *
 * Parent's ownVariantAttributes become inheritedVariantAttributes
 * (same parent → same inherited attrs).
 */
export function buildDynamicVariantSiblingDraft(
  sibling: Product,
  parent: Product,
  parentVariantId: string
): Partial<Product> {
  const cloned = deepClone(sibling) as Partial<Product>
  cleanDraftBase(cloned, parentVariantId)

  cloned.inheritedVariantAttributes = {
    ...(parent.inheritedVariantAttributes ?? {}),
    ...(parent.ownVariantAttributes ?? {}),
  }

  // Keep sibling's ownVariantAttributes as-is (this is a copy)
  cloned.ownVariantAttributes = sibling.ownVariantAttributes
    ? deepClone(sibling.ownVariantAttributes)
    : {}

  cloned.mixins = cloned.mixins ?? {}

  return cloned
}
