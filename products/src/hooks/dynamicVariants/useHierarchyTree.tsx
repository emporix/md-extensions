import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProductData } from '../../context/ProductDataProvider'
import { useProductsApi } from '../api/products'
import { useLocalizedValue } from '../useLocalizedValue'
import { useSearchParams } from 'react-router'
import { Product, ProductType } from '../../models/Category.model'
import { parentVariantPathHierarchyRootId } from '../../helpers/parentVariantPath'
import {
  buildDraftRootNode,
  buildVariantTreeNodes,
  DRAFT_KEY,
  injectDraftNode,
} from '../../helpers/dynamicVariants/hierarchy.helpers'

export function useHierarchyTree() {
  const { t } = useTranslation()
  const { product, parentProduct } = useProductData()
  const { getProduct } = useProductsApi()
  const { getContentLangValue } = useLocalizedValue()
  const [searchParams] = useSearchParams()

  const [rootProduct, setRootProduct] = useState<Product | null>(null)
  const [rootLoadPending, setRootLoadPending] = useState(false)
  const expandedKeysRef = useRef<Record<string, boolean>>({})
  const [expandedKeys, setExpandedKeysRaw] = useState<Record<string, boolean>>(
    {}
  )
  const parentVariantIdParam = searchParams.get('parentVariantId')
  const isAddFlow = !product?.id && !!parentVariantIdParam

  const setExpandedKeys = useCallback(
    (
      updater:
        | Record<string, boolean>
        | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => {
      setExpandedKeysRaw((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        expandedKeysRef.current = next
        return next
      })
    },
    []
  )

  const rootId = useMemo(() => {
    // From current product's parentVariantPath (last element = root)
    const fromPath = parentVariantPathHierarchyRootId(
      product?.parentVariantPath
    )
    if (fromPath) return fromPath

    // Current product IS the root (no parent)
    if (!product?.parentVariantId) return product?.id ?? null

    // From parent product's path
    const fromParentPath = parentVariantPathHierarchyRootId(
      parentProduct?.parentVariantPath
    )
    if (fromParentPath) return fromParentPath

    // Parent product IS the root
    if (parentProduct && !parentProduct.parentVariantId && parentProduct.id)
      return parentProduct.id

    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    product?.id,
    product?.parentVariantId,
    product?.parentVariantPath,
    parentProduct?.id,
    parentProduct?.parentVariantId,
    parentProduct?.parentVariantPath,
  ])

  const draftNewRoot =
    !product?.id &&
    !product?.parentVariantId &&
    !parentVariantIdParam &&
    rootId === null

  const loadRoot = useCallback(async () => {
    if (!rootId) {
      setRootProduct(null)
      setRootLoadPending(false)
      return
    }
    setRootLoadPending(true)
    try {
      const data = (await getProduct(rootId)) as Product
      setRootProduct(data)

      // Expand all nodes from root down to the current product
      const keysToExpand: Record<string, boolean> = {
        ...expandedKeysRef.current,
        [rootId]: true,
      }
      if (product?.id) keysToExpand[product.id] = true
      if (parentVariantIdParam) keysToExpand[parentVariantIdParam] = true
      if (product?.parentVariantPath) {
        product.parentVariantPath.forEach((id) => {
          keysToExpand[id] = true
        })
      }
      if (parentProduct?.parentVariantPath) {
        parentProduct.parentVariantPath.forEach((id) => {
          keysToExpand[id] = true
        })
      }
      if (parentProduct?.id) keysToExpand[parentProduct.id] = true
      setExpandedKeys(keysToExpand)
    } catch {
      setRootProduct(null)
    } finally {
      setRootLoadPending(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getProduct,
    rootId,
    parentVariantIdParam,
    product?.id,
    product?.parentVariantPath,
    parentProduct?.id,
    parentProduct?.parentVariantPath,
  ])

  const treeNodes = useMemo(() => {
    if (draftNewRoot) {
      return buildDraftRootNode(
        t('products.dynamicVariant.labels.draftNewChild'),
        product?.dynamicVariantType
      )
    }

    if (!rootProduct?.id) return []

    const rootLabel = rootProduct.name
      ? getContentLangValue(rootProduct.name) || rootProduct.id
      : rootProduct.id

    let nodes = buildVariantTreeNodes(
      rootProduct,
      rootLabel,
      rootProduct.dynamicVariantType,
      (loc) => (loc ? getContentLangValue(loc) : '')
    )

    if (isAddFlow && parentVariantIdParam) {
      nodes = injectDraftNode(
        nodes,
        parentVariantIdParam,
        t('products.dynamicVariant.labels.draftNewChild'),
        product?.dynamicVariantType
      )
    }

    return nodes
  }, [
    rootProduct,
    getContentLangValue,
    isAddFlow,
    parentVariantIdParam,
    product?.dynamicVariantType,
    draftNewRoot,
    t,
  ])

  const selectionKey = product?.id
    ? String(product.id)
    : isAddFlow
      ? DRAFT_KEY
      : null

  const isDynamicVariant =
    product?.productType === ProductType.dynamicVariant ||
    product?.productType?.toUpperCase() === ProductType.dynamicVariant

  const hierarchyLoading =
    !draftNewRoot && !!rootId && rootLoadPending && !rootProduct

  useEffect(() => {
    loadRoot()
  }, [loadRoot, product])

  // After creating a new product, the root's variants map may not
  // include the child yet. Retry loadRoot if the current product
  // is missing from the tree.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    if (!product?.id || !rootProduct?.id || isAddFlow || rootLoadPending) {
      return
    }

    const productInTree =
      product.id === rootProduct.id ||
      !!(rootProduct.variants && rootProduct.variants[product.id])

    if (!productInTree) {
      retryTimerRef.current = setTimeout(() => {
        loadRoot()
      }, 1000)
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [product?.id, rootProduct, isAddFlow, rootLoadPending, loadRoot])

  return {
    treeNodes,
    expandedKeys,
    setExpandedKeys,
    selectionKey,
    isDynamicVariant,
    hierarchyLoading,
    isAddFlow,
    parentVariantIdParam,
    currentProductId: product?.id ?? null,
    rootId,
    loadRoot,
  }
}
