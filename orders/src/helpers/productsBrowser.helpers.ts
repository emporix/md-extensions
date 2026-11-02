import type { CategoryTree } from '@emporix/api-calls'
import {
  FilterMatchMode,
  type DataTableFilterMeta,
  type ProductsBrowserRow,
  type TreeNode,
} from '@emporix/component-library'
import type Localized from '../models/Localized.model'
import type { Product } from '../models/Product.model'
import { trimCloudinaryImage } from './images'

/** A row of the add-entry products browser; keeps the product it shows. */
export type AddEntryProductRow = ProductsBrowserRow & { product: Product }

type GetLocalizedValue = (value: Localized | string | undefined) => string

// The products API filters by category itself, so the tree view is the list
// query narrowed to the selected categories.
export const withCategoryScope = (
  filters: DataTableFilterMeta | undefined,
  categoryIds: string[]
): DataTableFilterMeta | undefined => {
  if (categoryIds.length === 0) {
    return filters
  }
  return {
    ...(filters ?? {}),
    categoryIds: { value: categoryIds, matchMode: FilterMatchMode.IN },
  }
}

/**
 * A category's name as MD's getContentLangValue resolves it: the content
 * language (in any letter case), else the first non-empty name tagged with
 * its language. The id stands in for a category with no name at all.
 */
export const categoryLabel = (
  tree: CategoryTree,
  contentLanguage: string | undefined
): string => {
  const names = Object.entries(tree.localizedName ?? {})
  const language = contentLanguage?.toLowerCase()
  const own = names.find(
    ([lang, name]) => lang.toLowerCase() === language && name
  )
  if (own) {
    return own[1]
  }
  const fallback = names.find(([, name]) => name)
  return fallback ? `${fallback[1]}(${fallback[0]})` : tree.id
}

/** Category trees as tree nodes, ordered by position on every level. */
export const toCategoryNodes = (
  trees: CategoryTree[],
  contentLanguage: string | undefined
): TreeNode[] =>
  [...trees]
    .sort((a, b) => a.position - b.position)
    .map((tree) => ({
      key: tree.id,
      label: categoryLabel(tree, contentLanguage),
      data: tree,
      children: tree.subcategories?.length
        ? toCategoryNodes(tree.subcategories, contentLanguage)
        : undefined,
    }))

export const toProductRow = (
  product: Product,
  getName: GetLocalizedValue
): AddEntryProductRow => {
  // Media can also hold PDFs or videos; like MD, show the first image.
  const imageUrl = product.media?.find(
    (media) => !media.contentType || media.contentType.startsWith('image/')
  )?.url
  return {
    id: product.id,
    code: product.code,
    name: getName(product.name),
    imageUrl: imageUrl ? trimCloudinaryImage(imageUrl, 32, 32) : null,
    productType: product.productType,
    product,
  }
}
