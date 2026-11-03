import { describe, expect, test } from 'vitest'
import type { TreeNode } from '@emporix/component-library'
import { CategoryTree } from '../../models/Category.model'
import {
  findAncestorKeys,
  mapCategoryTreesToNodes,
  relabelNodes,
} from './categoriesTree.helpers'

const node = (key: string, children: TreeNode[] = []): TreeNode => ({
  key,
  data: { id: key },
  children,
})

// root1 -> [a -> [a1, a2], b]
// root2 -> [c]
const tree: TreeNode[] = [
  node('root1', [node('a', [node('a1'), node('a2')]), node('b')]),
  node('root2', [node('c')]),
]

describe('findAncestorKeys', () => {
  test('returns the ancestors of a deep node, root first', () => {
    expect(findAncestorKeys(tree, 'a1')).toEqual(['root1', 'a'])
  })

  test('returns no ancestors for a root', () => {
    expect(findAncestorKeys(tree, 'root2')).toEqual([])
  })

  test('returns null when the key is absent', () => {
    expect(findAncestorKeys(tree, 'missing')).toBeNull()
  })
})

describe('relabelNodes', () => {
  const named = (key: string, name: string, children?: TreeNode[]) => ({
    key,
    label: 'old',
    data: { id: key, localizedName: { en: name } },
    children,
  })

  test('resolves the labels of nested nodes again', () => {
    const nodes = [named('r', 'Root', [named('c', 'Child', [])])]
    const relabeled = relabelNodes(nodes, (value) =>
      typeof value === 'object' ? `${value.en}!` : ''
    )
    expect(relabeled[0].label).toBe('Root!')
    expect(relabeled[0].children?.[0].label).toBe('Child!')
    expect(relabeled[0].children?.[0].key).toBe('c')
  })

  test('does not change the given nodes', () => {
    const nodes = [named('r', 'Root', [named('c', 'Child', [])])]
    relabelNodes(nodes, () => 'new')
    expect(nodes[0].label).toBe('old')
    expect(nodes[0].children?.[0].label).toBe('old')
  })

  test('keeps nodes without children as they are', () => {
    const [leaf] = relabelNodes([named('l', 'Leaf')], () => 'Leaf')
    expect(leaf.children).toBeUndefined()
  })
})

describe('mapCategoryTreesToNodes', () => {
  const category = (
    id: string,
    position: number,
    subcategories?: CategoryTree[]
  ): CategoryTree => ({
    id,
    position,
    published: true,
    localizedName: { en: id },
    subcategories,
  })

  const isLeaf = (item: CategoryTree) => (item.subcategories?.length ?? 0) === 0

  test('orders roots and subcategories by position', () => {
    const nodes = mapCategoryTreesToNodes(
      [
        category('second', 2),
        category('first', 1, [category('y', 5), category('x', 0)]),
      ],
      (value) => (typeof value === 'object' ? (value.en ?? '') : '')
    )
    expect(nodes.map(({ key }) => key)).toEqual(['first', 'second'])
    expect(nodes[0].children?.map(({ key }) => key)).toEqual(['x', 'y'])
    expect(nodes[0].label).toBe('first')
  })

  test('marks categories without subcategories as leaves', () => {
    const [root] = mapCategoryTreesToNodes(
      [category('root', 0, [category('leaf', 0)])],
      () => ''
    )
    expect(root.leaf).toBe(false)
    expect(root.children?.[0].leaf).toBe(true)
  })

  test('sets selectable only when a predicate is given', () => {
    const tree = [category('root', 0, [category('leaf', 0)])]
    const [plain] = mapCategoryTreesToNodes(tree, () => '')
    const [leafOnly] = mapCategoryTreesToNodes(tree, () => '', isLeaf)
    expect(plain.selectable).toBeUndefined()
    expect(leafOnly.selectable).toBe(false)
    expect(leafOnly.children?.[0].selectable).toBe(true)
  })
})
