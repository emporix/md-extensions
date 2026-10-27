import type { TreeNode } from '@emporix/component-library'
import { Product, VariantMapEntry } from '../../models/Category.model'

export interface HierarchyNodeData {
  code: string
  parentId?: string
  nodeKind: 'root' | 'child' | 'draft'
  displayName: string
  dynamicVariantType?: string
  sellable: boolean
  published: boolean
}

export const DRAFT_KEY = '__new_variant_draft__'

export function buildVariantTreeNodes(
  rootProduct: Product,
  rootLabel: string,
  rootDynamicVariantType: string | undefined,
  getLabel: (loc: Record<string, string> | undefined) => string
): TreeNode[] {
  const rootId = rootProduct.id as string
  const rootTitle = (rootLabel || rootId).trim()
  const variants = rootProduct.variants
  if (!variants || Object.keys(variants).length === 0) {
    return [
      {
        key: rootId,
        label: rootTitle,
        leaf: true,
        data: {
          code: rootProduct.code,
          nodeKind: 'root',
          displayName: rootTitle,
          dynamicVariantType: rootDynamicVariantType,
          sellable: !!rootProduct.sellable,
          published: rootProduct.published,
        } satisfies HierarchyNodeData,
      },
    ]
  }
  const childrenByParent = new Map<string, string[]>()
  for (const variantId of Object.keys(variants)) {
    const entry = variants[variantId]
    const pid = entry.parentVariantId || rootId
    let bucket = childrenByParent.get(pid)
    if (!bucket) {
      bucket = []
      childrenByParent.set(pid, bucket)
    }
    bucket.push(variantId)
  }
  const buildNode = (
    id: string,
    parentSellable: boolean,
    parentPublished: boolean
  ): TreeNode => {
    const entry = variants[id]
    const nameLoc = entry?.name as Record<string, string> | undefined
    const childIds = childrenByParent.get(id) || []
    const dvt = entry?.dynamicVariantType
    const namePart = (nameLoc ? getLabel(nameLoc) : id).trim()
    const resolvedSellable =
      entry?.sellable != null ? entry.sellable : parentSellable
    const resolvedPublished =
      entry?.published != null ? entry.published : parentPublished
    return {
      key: id,
      label: namePart,
      children: childIds.length
        ? childIds.map((cid) =>
            buildNode(cid, resolvedSellable, resolvedPublished)
          )
        : undefined,
      leaf: childIds.length === 0,
      data: {
        code: entry?.code || '',
        parentId: entry?.parentVariantId || rootId,
        nodeKind: 'child',
        displayName: namePart,
        dynamicVariantType: dvt,
        sellable: resolvedSellable,
        published: resolvedPublished,
      } satisfies HierarchyNodeData,
    }
  }
  const childIds = childrenByParent.get(rootId) || []
  const rootSellable = !!rootProduct.sellable
  const rootPublished = rootProduct.published
  return [
    {
      key: rootId,
      label: rootTitle,
      children: childIds.map((cid) =>
        buildNode(cid, rootSellable, rootPublished)
      ),
      data: {
        code: rootProduct.code,
        nodeKind: 'root',
        displayName: rootTitle,
        dynamicVariantType: rootDynamicVariantType,
        sellable: !!rootProduct.sellable,
        published: rootProduct.published,
      } satisfies HierarchyNodeData,
    },
  ]
}

export function buildDraftRootNode(
  draftLabel: string,
  draftDynamicVariantType?: string
): TreeNode[] {
  return [
    {
      key: DRAFT_KEY,
      label: draftLabel,
      leaf: true,
      selectable: false,
      data: {
        code: '',
        nodeKind: 'draft',
        displayName: draftLabel,
        dynamicVariantType: draftDynamicVariantType,
        sellable: false,
        published: false,
      } satisfies HierarchyNodeData,
    },
  ]
}

export function injectDraftNode(
  nodes: TreeNode[],
  parentNodeKey: string,
  draftLabel: string,
  draftDynamicVariantType?: string
): TreeNode[] {
  const draftNode: TreeNode = {
    key: DRAFT_KEY,
    label: draftLabel,
    leaf: true,
    selectable: false,
    data: {
      code: '',
      nodeKind: 'draft',
      displayName: draftLabel,
      dynamicVariantType: draftDynamicVariantType,
      sellable: false,
      published: false,
    } satisfies HierarchyNodeData,
  }
  function walk(node: TreeNode): TreeNode {
    if (String(node.key) === parentNodeKey) {
      return {
        ...node,
        leaf: false,
        children: [...(node.children ?? []), draftNode],
      }
    }
    if (node.children) {
      return { ...node, children: node.children.map(walk) }
    }
    return node
  }
  return nodes.map(walk)
}

export function getVariantCodes(
  variants?: Record<string, VariantMapEntry>
): string[] {
  if (!variants) return []
  return Object.values(variants)
    .map((v) => v.code)
    .filter(Boolean) as string[]
}
