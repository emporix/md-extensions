import { describe, expect, it } from 'vitest'
import {
  buildDraftRootNode,
  buildVariantTreeNodes,
  DRAFT_KEY,
  getVariantCodes,
  HierarchyNodeData,
  injectDraftNode,
} from './hierarchy.helpers'
import {
  Product,
  ProductType,
  VariantMapEntry,
} from '../../models/Category.model'

const makeRoot = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'root-1',
    code: 'ROOT',
    name: { en: 'Root Product' },
    productType: ProductType.dynamicVariant,
    sellable: true,
    published: true,
    dynamicVariantType: 'color',
    ...overrides,
  }) as Product

const getLabel = (loc: Record<string, string> | undefined) =>
  loc ? Object.values(loc)[0] || '' : ''

describe('buildVariantTreeNodes', () => {
  it('builds a single root node when there are no variants', () => {
    const root = makeRoot({ variants: undefined })
    const nodes = buildVariantTreeNodes(root, 'Root Product', 'color', getLabel)

    expect(nodes).toHaveLength(1)
    expect(nodes[0].key).toBe('root-1')
    expect(nodes[0].leaf).toBe(true)
    const data = nodes[0].data as HierarchyNodeData
    expect(data.nodeKind).toBe('root')
    expect(data.sellable).toBe(true)
    expect(data.published).toBe(true)
    expect(data.code).toBe('ROOT')
  })

  it('builds tree with children from variants map', () => {
    const root = makeRoot({
      variants: {
        'child-1': {
          code: 'C1',
          name: { en: 'Child 1' },
          parentVariantId: 'root-1',
          sellable: false,
          published: false,
          dynamicVariantType: 'size',
        } as VariantMapEntry,
        'child-2': {
          code: 'C2',
          name: { en: 'Child 2' },
          parentVariantId: 'root-1',
        } as VariantMapEntry,
      },
    })

    const nodes = buildVariantTreeNodes(root, 'Root Product', 'color', getLabel)

    expect(nodes).toHaveLength(1)
    const rootNode = nodes[0]
    expect(rootNode.children).toHaveLength(2)

    const c1 = rootNode.children![0]
    expect(c1.key).toBe('child-1')
    expect((c1.data as HierarchyNodeData).code).toBe('C1')
    expect((c1.data as HierarchyNodeData).sellable).toBe(false)
    expect((c1.data as HierarchyNodeData).published).toBe(false)

    const c2 = rootNode.children![1]
    expect(c2.key).toBe('child-2')
  })

  it('inherits sellable/published from parent when child has undefined values', () => {
    const root = makeRoot({
      sellable: true,
      published: true,
      variants: {
        'child-1': {
          code: 'C1',
          parentVariantId: 'root-1',
          // sellable and published are undefined → should inherit from root
        } as VariantMapEntry,
        'grandchild-1': {
          code: 'GC1',
          parentVariantId: 'child-1',
          // should inherit from child-1, which inherits from root
        } as VariantMapEntry,
      },
    })

    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const child = nodes[0].children![0]
    const grandchild = child.children![0]

    expect((child.data as HierarchyNodeData).sellable).toBe(true)
    expect((child.data as HierarchyNodeData).published).toBe(true)
    expect((grandchild.data as HierarchyNodeData).sellable).toBe(true)
    expect((grandchild.data as HierarchyNodeData).published).toBe(true)
  })

  it('child overrides inherited sellable/published when explicitly set', () => {
    const root = makeRoot({
      sellable: true,
      published: true,
      variants: {
        'child-1': {
          code: 'C1',
          parentVariantId: 'root-1',
          sellable: false,
          published: false,
        } as VariantMapEntry,
        'grandchild-1': {
          code: 'GC1',
          parentVariantId: 'child-1',
          // inherits from child-1's overridden values
        } as VariantMapEntry,
      },
    })

    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const child = nodes[0].children![0]
    const grandchild = child.children![0]

    expect((child.data as HierarchyNodeData).sellable).toBe(false)
    expect((child.data as HierarchyNodeData).published).toBe(false)
    // grandchild inherits child's overridden false
    expect((grandchild.data as HierarchyNodeData).sellable).toBe(false)
    expect((grandchild.data as HierarchyNodeData).published).toBe(false)
  })

  it('uses product id as label fallback when name is missing', () => {
    const root = makeRoot({
      variants: {
        'child-no-name': {
          code: 'CNN',
          parentVariantId: 'root-1',
        } as VariantMapEntry,
      },
    })

    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const child = nodes[0].children![0]
    expect((child.data as HierarchyNodeData).displayName).toBe('child-no-name')
  })
})

describe('buildDraftRootNode', () => {
  it('builds a single draft node with correct defaults', () => {
    const nodes = buildDraftRootNode('New Product', 'color')

    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    expect(node.key).toBe(DRAFT_KEY)
    expect(node.leaf).toBe(true)
    expect(node.selectable).toBe(false)

    const data = node.data as HierarchyNodeData
    expect(data.nodeKind).toBe('draft')
    expect(data.displayName).toBe('New Product')
    expect(data.dynamicVariantType).toBe('color')
    expect(data.sellable).toBe(false)
    expect(data.published).toBe(false)
  })
})

describe('injectDraftNode', () => {
  it('injects a draft node as a child of the matching parent', () => {
    const root = makeRoot({
      variants: {
        'child-1': {
          code: 'C1',
          parentVariantId: 'root-1',
        } as VariantMapEntry,
      },
    })
    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const result = injectDraftNode(nodes, 'child-1', 'Draft Child', 'size')

    const child = result[0].children![0]
    expect(child.children).toHaveLength(1)

    const draft = child.children![0]
    expect(draft.key).toBe(DRAFT_KEY)
    expect((draft.data as HierarchyNodeData).displayName).toBe('Draft Child')
    expect((draft.data as HierarchyNodeData).dynamicVariantType).toBe('size')
    expect(child.leaf).toBe(false)
  })

  it('injects draft at root level when parentNodeKey matches root', () => {
    const root = makeRoot()
    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const result = injectDraftNode(nodes, 'root-1', 'Draft', 'color')

    expect(result[0].children).toHaveLength(1)
    expect(result[0].children![0].key).toBe(DRAFT_KEY)
  })

  it('does not modify tree if parentNodeKey is not found', () => {
    const root = makeRoot()
    const nodes = buildVariantTreeNodes(root, 'Root', 'color', getLabel)
    const result = injectDraftNode(nodes, 'non-existent', 'Draft', 'color')

    expect(result[0].children).toBeUndefined()
  })
})

describe('getVariantCodes', () => {
  it('returns codes from variants map', () => {
    const variants: Record<string, VariantMapEntry> = {
      a: { code: 'CODE-A' } as VariantMapEntry,
      b: { code: 'CODE-B' } as VariantMapEntry,
    }
    expect(getVariantCodes(variants)).toEqual(['CODE-A', 'CODE-B'])
  })

  it('filters out empty/undefined codes', () => {
    const variants: Record<string, VariantMapEntry> = {
      a: { code: 'CODE-A' } as VariantMapEntry,
      b: { code: '' } as VariantMapEntry,
      c: {} as VariantMapEntry,
    }
    expect(getVariantCodes(variants)).toEqual(['CODE-A'])
  })

  it('returns empty array for undefined variants', () => {
    expect(getVariantCodes(undefined)).toEqual([])
  })
})
