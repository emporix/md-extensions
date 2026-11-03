/**
 * `parentVariantPath` API order: index 0 = immediate parent, last = hierarchy root.
 */

export function parentVariantPathHierarchyRootId(
  path: string[] | null | undefined
): string | undefined {
  if (!path?.length) return undefined
  return path[path.length - 1]
}

/** Breadcrumb: root first, down to immediate parent. */
export function parentVariantPathBreadcrumbIds(
  path: string[] | null | undefined
): string[] {
  if (!path?.length) return []
  return [...path].reverse()
}
