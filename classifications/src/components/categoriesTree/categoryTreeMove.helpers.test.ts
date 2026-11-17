import { describe, expect, it } from 'vitest'
import type { TreeNode } from '@emporix/component-library'
import {
  ROOT_PARENT_ID,
  getCategoryMovePlacements,
  getCategoryMoveRootKeys,
} from './categoryTreeMove.helpers'

const node = (
  id: string,
  position: number,
  children: TreeNode[] = []
): TreeNode => ({
  key: id,
  data: { id, position },
  children,
})

// a (0) → a1 (0), a2 (1); b (1) → b1 (0)
const before = (): TreeNode[] => [
  node('a', 0, [node('a1', 0), node('a2', 1)]),
  node('b', 1, [node('b1', 0)]),
]

describe('getCategoryMovePlacements', () => {
  it('makes a category dropped onto another one its child, after the children', () => {
    const after = [
      node('a', 0, [node('a1', 0)]),
      node('b', 1, [node('b1', 0), node('a2', 1)]),
    ]

    expect(getCategoryMovePlacements(before(), after, 'a2')).toEqual(
      new Map([['a2', { parentId: 'b' }]])
    )
  })

  it('gives a category dropped between other parents siblings a free position', () => {
    // a1 dropped before b1: no position left below 0, so b's children are
    // renumbered (a1 already holds 0) and a1 gets b as parent.
    const after = [
      node('a', 0, [node('a2', 1)]),
      node('b', 1, [node('a1', 0), node('b1', 0)]),
    ]

    expect(getCategoryMovePlacements(before(), after, 'a1')).toEqual(
      new Map([
        ['a1', { parentId: 'b' }],
        ['b1', { position: 1 }],
      ])
    )
  })

  it('reorders siblings of the same parent without a parent change', () => {
    const after = [
      node('a', 0, [node('a2', 1), node('a1', 0)]),
      node('b', 1, [node('b1', 0)]),
    ]

    expect(getCategoryMovePlacements(before(), after, 'a2')).toEqual(
      new Map([
        ['a2', { position: 0 }],
        ['a1', { position: 1 }],
      ])
    )
  })

  it("moves a category to the top level with the parent 'root'", () => {
    const after = [
      node('a', 0, [node('a2', 1)]),
      node('b', 1, [node('b1', 0)]),
      node('a1', 0),
    ]

    expect(getCategoryMovePlacements(before(), after, 'a1')).toEqual(
      new Map([['a1', { position: 2, parentId: ROOT_PARENT_ID }]])
    )
  })

  it('needs no change when the category keeps a fitting place', () => {
    expect(getCategoryMovePlacements(before(), before(), 'a2')).toEqual(
      new Map()
    )
  })

  it('is null when the dragged category is not in the new tree', () => {
    expect(getCategoryMovePlacements(before(), before(), 'gone')).toBeNull()
  })
})

describe('getCategoryMoveRootKeys', () => {
  const after = [
    node('a', 0, [node('a1', 0)]),
    node('b', 1, [node('b1', 0), node('a2', 1)]),
  ]

  it('rebuilds the new and the old root after a move across roots', () => {
    expect(
      getCategoryMoveRootKeys(before(), after, 'a2', ['a2'], new Set())
    ).toEqual(['b', 'a'])
  })

  it('rebuilds renumbered top-level categories as their own roots', () => {
    const reordered = [node('b', 1), node('a', 0)]
    expect(
      getCategoryMoveRootKeys(before(), reordered, 'b', ['b', 'a'], new Set())
    ).toEqual(['b', 'a', 'b'])
  })

  it('rebuilds a failed change where it was and where it was dropped', () => {
    expect(
      getCategoryMoveRootKeys(before(), after, 'a2', ['a2'], new Set(['a2']))
    ).toEqual(['a', 'b'])
  })
})
