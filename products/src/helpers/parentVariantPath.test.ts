import { describe, expect, it } from 'vitest'
import {
  parentVariantPathBreadcrumbIds,
  parentVariantPathHierarchyRootId,
} from './parentVariantPath'

describe('parentVariantPathHierarchyRootId', () => {
  it('returns undefined for null, undefined and empty paths', () => {
    expect(parentVariantPathHierarchyRootId(null)).toBeUndefined()
    expect(parentVariantPathHierarchyRootId(undefined)).toBeUndefined()
    expect(parentVariantPathHierarchyRootId([])).toBeUndefined()
  })

  it('returns the last entry as the hierarchy root', () => {
    expect(parentVariantPathHierarchyRootId(['parent', 'grand', 'root'])).toBe(
      'root'
    )
    expect(parentVariantPathHierarchyRootId(['only'])).toBe('only')
  })
})

describe('parentVariantPathBreadcrumbIds', () => {
  it('returns an empty array for null, undefined and empty paths', () => {
    expect(parentVariantPathBreadcrumbIds(null)).toEqual([])
    expect(parentVariantPathBreadcrumbIds(undefined)).toEqual([])
    expect(parentVariantPathBreadcrumbIds([])).toEqual([])
  })

  it('orders ids from root down to the immediate parent', () => {
    expect(parentVariantPathBreadcrumbIds(['parent', 'grand', 'root'])).toEqual(
      ['root', 'grand', 'parent']
    )
  })

  it('does not mutate the input path', () => {
    const path = ['parent', 'root']
    parentVariantPathBreadcrumbIds(path)
    expect(path).toEqual(['parent', 'root'])
  })
})
