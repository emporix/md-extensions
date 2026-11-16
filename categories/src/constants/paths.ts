/**
 * Hash-relative paths inside the federated remote (HashRouter). They mirror
 * MD's `/apps/management/categories/...` pathnames under the module root.
 * Ids are URL-encoded so ids with `#`, `/` or `?` stay one path segment.
 */
export const MODULE_ROOT = '/'

/** `?view=list|tree` on the list page. */
export const VIEW_PARAM = 'view'
/** `?categoryId=` — the category selected in the tree view. */
export const SELECTED_CATEGORY_PARAM = 'categoryId'

const withQuery = (path: string, query?: string | URLSearchParams) => {
  const search = query?.toString().replace(/^\?/, '') ?? ''
  return search ? `${path}?${search}` : path
}

export const categoriesListPath = (query?: string | URLSearchParams) =>
  withQuery(MODULE_ROOT, query)

export const categoryAddPath = (query?: string | URLSearchParams) =>
  withQuery('/add', query)

export const categoryDetailPath = (
  categoryId: string,
  query?: string | URLSearchParams
) => withQuery(`/${encodeURIComponent(categoryId)}`, query)
