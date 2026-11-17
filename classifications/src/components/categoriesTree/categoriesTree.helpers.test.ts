import { describe, expect, test } from 'vitest'
import type { TreeNode } from '@emporix/component-library'
import { CategoryTree } from '../../models/Category.model'
import {
  findAncestorKeys,
  findInsertLocation,
  findNodeLocation,
  findRootKeyContaining,
  getInsertPositions,
  getPositionUpdates,
  pickCategorySubtrees,
  relabelNodes,
  removeNode,
  replaceRootNodes,
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

describe('findNodeLocation', () => {
  test('locates a top-level node', () => {
    const loc = findNodeLocation(tree, 'root2')
    expect(loc?.parent).toBeNull()
    expect(loc?.index).toBe(1)
    expect(loc?.siblings).toHaveLength(2)
  })

  test('locates a nested node with parent, siblings and index', () => {
    const loc = findNodeLocation(tree, 'a2')
    expect(loc?.parent?.key).toBe('a')
    expect(loc?.index).toBe(1)
    expect(loc?.siblings.map((s) => s.key)).toEqual(['a1', 'a2'])
  })

  test('returns null when the key is absent', () => {
    expect(findNodeLocation(tree, 'missing')).toBeNull()
  })
})

describe('findRootKeyContaining', () => {
  test('returns the containing root for a deep node', () => {
    expect(findRootKeyContaining(tree, 'a1')).toBe('root1')
  })

  test('returns the node itself when it is a root', () => {
    expect(findRootKeyContaining(tree, 'root2')).toBe('root2')
  })

  test('returns null when the key is absent', () => {
    expect(findRootKeyContaining(tree, 'missing')).toBeNull()
  })
})

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

describe('removeNode', () => {
  const keysOf = (nodes: TreeNode[]): unknown[] =>
    nodes.map(({ key, children }) => [key, keysOf(children ?? [])])

  test('drops a nested node with its subtree', () => {
    expect(keysOf(removeNode(tree, 'a'))).toEqual([
      ['root1', [['b', []]]],
      ['root2', [['c', []]]],
    ])
  })

  test('drops a root', () => {
    expect(removeNode(tree, 'root2').map(({ key }) => key)).toEqual(['root1'])
  })

  test('turns a parent left without children into a leaf', () => {
    const [, root2] = removeNode(tree, 'c')
    expect(root2.children).toEqual([])
    expect(root2.leaf).toBe(true)
  })

  test('keeps every node when the key is absent', () => {
    expect(keysOf(removeNode(tree, 'missing'))).toEqual(keysOf(tree))
  })

  test('does not mutate the tree', () => {
    const original = JSON.parse(JSON.stringify(tree))
    removeNode(tree, 'a1')
    expect(tree).toEqual(original)
  })
})

describe('replaceRootNodes', () => {
  const root = (key: string, position: number, label = key): TreeNode => ({
    key,
    label,
    data: { id: key, position },
  })

  test('swaps the rebuilt roots in by key', () => {
    const roots = [root('a', 0), root('b', 1)]
    const rebuilt = root('a', 0, 'renamed')
    expect(replaceRootNodes(roots, [rebuilt])).toEqual([rebuilt, roots[1]])
  })

  test('moves a root whose position changed', () => {
    const roots = [root('a', 0), root('b', 1), root('c', 2)]
    const result = replaceRootNodes(roots, [root('a', 5)])
    expect(result.map(({ key }) => key)).toEqual(['b', 'c', 'a'])
  })

  test('keeps the current order of roots sharing a position', () => {
    const roots = [root('b', 1), root('a', 1)]
    const result = replaceRootNodes(roots, [root('a', 1, 'renamed')])
    expect(result.map(({ key }) => key)).toEqual(['b', 'a'])
  })

  test('adds rebuilt trees that are new roots', () => {
    const roots = [root('a', 0), root('b', 2)]
    const result = replaceRootNodes(roots, [root('new', 1)])
    expect(result.map(({ key }) => key)).toEqual(['a', 'new', 'b'])
  })

  test('does not mutate the roots', () => {
    const roots = [root('a', 3), root('b', 1)]
    const original = [...roots]
    replaceRootNodes(roots, [])
    expect(roots).toEqual(original)
  })
})

const category = (
  id: string,
  position: number,
  subcategories: CategoryTree[] = []
): CategoryTree => ({
  id,
  position,
  published: true,
  localizedName: { en: id },
  subcategories,
})

describe('getPositionUpdates', () => {
  test('returns nothing when the moved category already fits its slot', () => {
    const siblings = [category('a', 0), category('moved', 5), category('b', 9)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([])
  })

  test('takes the slot after the previous sibling when there is a gap', () => {
    const siblings = [category('a', 0), category('moved', 7), category('b', 4)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 1 },
    ])
  })

  test('takes the slot after the last sibling when moved to the end', () => {
    const siblings = [category('a', 3), category('b', 4), category('moved', 0)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 5 },
    ])
  })

  test('takes the slot before the next sibling when moved to the start', () => {
    const siblings = [category('moved', 9), category('a', 3), category('b', 4)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 2 },
    ])
  })

  test('renumbers the siblings that change when there is no gap', () => {
    const siblings = [category('a', 0), category('moved', 4), category('b', 1)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 1 },
      { id: 'b', position: 2 },
    ])
  })

  test('renumbers instead of using a negative position at the start', () => {
    const siblings = [category('moved', 3), category('a', 0), category('b', 1)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 0 },
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ])
  })

  test('renumbers siblings that share a position', () => {
    const siblings = [category('a', 0), category('moved', 0), category('b', 0)]
    expect(getPositionUpdates(siblings, 'moved')).toEqual([
      { id: 'moved', position: 1 },
      { id: 'b', position: 2 },
    ])
  })

  test('returns nothing for an only child or an unknown id', () => {
    expect(getPositionUpdates([category('moved', 4)], 'moved')).toEqual([])
    expect(getPositionUpdates([category('a', 0)], 'missing')).toEqual([])
  })

  test('does not mutate the siblings', () => {
    const siblings = [category('a', 0), category('moved', 4), category('b', 1)]
    const original = JSON.parse(JSON.stringify(siblings))
    getPositionUpdates(siblings, 'moved')
    expect(siblings).toEqual(original)
  })
})

describe('findInsertLocation', () => {
  test('goes last at the top level without an anchor', () => {
    const loc = findInsertLocation(tree, { target: 'child' })
    expect(loc?.parent).toBeNull()
    expect(loc?.siblings).toBe(tree)
    expect(loc?.index).toBe(2)
  })

  test('goes before or after the anchor among its siblings', () => {
    const above = findInsertLocation(tree, { target: 'above', anchorId: 'a2' })
    expect(above?.parent?.key).toBe('a')
    expect(above?.siblings.map((s) => s.key)).toEqual(['a1', 'a2'])
    expect(above?.index).toBe(1)
    const below = findInsertLocation(tree, { target: 'below', anchorId: 'a2' })
    expect(below?.index).toBe(2)
  })

  test('goes next to a top-level anchor at the top level', () => {
    const loc = findInsertLocation(tree, { target: 'above', anchorId: 'root1' })
    expect(loc?.parent).toBeNull()
    expect(loc?.index).toBe(0)
  })

  test('goes last among the children of the anchor', () => {
    const loc = findInsertLocation(tree, { target: 'child', anchorId: 'a' })
    expect(loc?.parent?.key).toBe('a')
    expect(loc?.siblings.map((s) => s.key)).toEqual(['a1', 'a2'])
    expect(loc?.index).toBe(2)
  })

  test('becomes the only child of a leaf anchor', () => {
    const loc = findInsertLocation(tree, { target: 'child', anchorId: 'a1' })
    expect(loc?.parent?.key).toBe('a1')
    expect(loc?.siblings).toEqual([])
    expect(loc?.index).toBe(0)
  })

  test('returns null when the anchor is absent', () => {
    expect(
      findInsertLocation(tree, { target: 'below', anchorId: 'missing' })
    ).toBeNull()
  })
})

describe('getInsertPositions', () => {
  test('starts at 0 among no siblings', () => {
    expect(getInsertPositions([], 0)).toEqual({ position: 0, updates: [] })
  })

  test('takes the slot after the last sibling at the end', () => {
    const siblings = [category('a', 0), category('b', 4)]
    expect(getInsertPositions(siblings, 2)).toEqual({
      position: 5,
      updates: [],
    })
  })

  test('takes the slot before the first sibling at the start', () => {
    const siblings = [category('a', 3), category('b', 4)]
    expect(getInsertPositions(siblings, 0)).toEqual({
      position: 2,
      updates: [],
    })
  })

  test('takes the slot after the previous sibling when there is a gap', () => {
    const siblings = [category('a', 0), category('b', 5)]
    expect(getInsertPositions(siblings, 1)).toEqual({
      position: 1,
      updates: [],
    })
  })

  test('renumbers the siblings that change when there is no gap', () => {
    const siblings = [category('a', 0), category('b', 1), category('c', 2)]
    expect(getInsertPositions(siblings, 1)).toEqual({
      position: 1,
      updates: [
        { id: 'b', position: 2 },
        { id: 'c', position: 3 },
      ],
    })
  })

  test('renumbers instead of using a negative position at the start', () => {
    const siblings = [category('a', 0), category('b', 1)]
    expect(getInsertPositions(siblings, 0)).toEqual({
      position: 0,
      updates: [
        { id: 'a', position: 1 },
        { id: 'b', position: 2 },
      ],
    })
  })

  test('renumbers siblings that share a position', () => {
    const siblings = [category('a', 0), category('b', 0), category('c', 0)]
    expect(getInsertPositions(siblings, 1)).toEqual({
      position: 1,
      updates: [
        { id: 'b', position: 2 },
        { id: 'c', position: 3 },
      ],
    })
  })

  test('does not mutate the siblings', () => {
    const siblings = [category('a', 0), category('b', 0)]
    const original = JSON.parse(JSON.stringify(siblings))
    getInsertPositions(siblings, 1)
    expect(siblings).toEqual(original)
  })
})

describe('pickCategorySubtrees', () => {
  // root1 -> [a -> [a1]], root2
  const trees = [
    category('root1', 0, [category('a', 0, [category('a1', 0)])]),
    category('root2', 1),
  ]

  test('returns roots and nested categories in the requested order', () => {
    expect(
      pickCategorySubtrees(trees, ['a', 'root2']).map(({ id }) => id)
    ).toEqual(['a', 'root2'])
  })

  test('keeps the subcategories of a picked category', () => {
    const [picked] = pickCategorySubtrees(trees, ['a'])
    expect(picked.subcategories?.map(({ id }) => id)).toEqual(['a1'])
  })

  test('skips ids that are not in the trees', () => {
    expect(pickCategorySubtrees(trees, ['missing'])).toEqual([])
    expect(pickCategorySubtrees([], ['a'])).toEqual([])
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
