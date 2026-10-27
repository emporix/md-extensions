import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  ProgressSpinner,
  Tree,
  useToast,
  type TreeNode,
} from '@emporix/component-library'
import { ProductType } from '../../../models/Category.model'
import { StylableProps } from '../../../helpers/props'
import { getApiErrorDetails } from '../../../helpers/api'
import {
  DRAFT_KEY,
  getVariantCodes,
} from '../../../helpers/dynamicVariants/hierarchy.helpers'
import { useHierarchyTree } from '../../../hooks/dynamicVariants/useHierarchyTree'
import { useProductsApi } from '../../../hooks/api/products'
import { useProductData } from '../../../context/ProductDataProvider'
import useCustomNavigate from '../../../hooks/useCustomNavigate'
import { usePermissions } from '../../../context/PermissionsProvider'
import { EmployeeDomains } from '../../../configs/accessControls'
import {
  productCreatePath,
  productDetailPath,
  productsListPath,
} from '../../../constants/paths'
import HierarchyNodeTemplate from './HierarchyNodeTemplate'
import styles from './DynamicVariant.module.scss'

const DELETE_REFRESH_DELAY_MS = 1000

const DynamicVariantHierarchySidebar = (props: StylableProps) => {
  const { style, className = '' } = props
  const { t } = useTranslation()
  const { deleteProduct } = useProductsApi()
  const { refreshData, product } = useProductData()
  const { navigate } = useCustomNavigate()
  const { showError, showSuccess } = useToast()
  const { hasPermission } = usePermissions()
  const {
    treeNodes,
    expandedKeys,
    setExpandedKeys,
    isDynamicVariant,
    hierarchyLoading,
    isAddFlow,
    parentVariantIdParam,
    currentProductId,
    loadRoot,
  } = useHierarchyTree()

  const [pendingNavKey, setPendingNavKey] = useState<string | null>(null)
  const [discardDraft, setDiscardDraft] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const canManage = hasPermission(EmployeeDomains.PRODUCTS_MANAGER)

  const confirmDelete = useCallback(async () => {
    if (!deleteNodeId) return
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteNodeId, true)
      if (deleteNodeId === currentProductId) {
        showSuccess(t('products.dynamicVariant.toasts.successDeleteProduct'))
        const fallbackId = product?.parentVariantId ?? null
        // Give the backend a moment to recompute the parent's variants map
        // before we navigate and reload the hierarchy, otherwise the freshly
        // deleted node still shows up in the tree.
        await new Promise((resolve) =>
          setTimeout(resolve, DELETE_REFRESH_DELAY_MS)
        )
        if (fallbackId) {
          navigate(productDetailPath(fallbackId))
        } else {
          navigate(productsListPath())
        }
      } else {
        await loadRoot()
        refreshData()
      }
    } catch (e: unknown) {
      showError(
        t('products.dynamicVariant.toasts.errorDeleteProduct'),
        getApiErrorDetails(e) ?? String(e)
      )
    } finally {
      setDeleteLoading(false)
      setDeleteNodeId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deleteNodeId,
    deleteProduct,
    currentProductId,
    product?.parentVariantId,
    navigate,
    loadRoot,
    refreshData,
  ])

  const onNodeSelect = (key: string) => {
    if (key === DRAFT_KEY || key === String(currentProductId)) return
    if (isAddFlow) {
      setPendingNavKey(key)
    } else {
      navigate(productDetailPath(key), {
        preserveQuery: ['tab'],
      })
    }
  }

  const onAddChild = (parentKey: string) => {
    navigate(
      productCreatePath(
        `type=${ProductType.dynamicVariant}&parentVariantId=${encodeURIComponent(
          parentKey
        )}`
      )
    )
  }

  const onAddSibling = (siblingKey: string, parentKey: string) => {
    navigate(
      productCreatePath(
        `type=${ProductType.dynamicVariant}&parentVariantId=${encodeURIComponent(
          parentKey
        )}&siblingId=${encodeURIComponent(siblingKey)}`
      )
    )
  }

  const onDelete = (key: string) => {
    if (key === DRAFT_KEY) {
      setDiscardDraft(true)
    } else {
      setDeleteNodeId(key)
    }
  }

  const treeNodeTemplate = (node: TreeNode) => (
    <HierarchyNodeTemplate
      node={node}
      canManage={canManage}
      onSelect={(key) => onNodeSelect(key)}
      onAddChild={(key) => onAddChild(key)}
      onAddSibling={(siblingKey, parentKey) =>
        onAddSibling(siblingKey, parentKey)
      }
      onDelete={(key) => onDelete(key)}
    />
  )

  const variants = useMemo(
    () => getVariantCodes(product?.variants),
    [product?.variants]
  )

  if (!isDynamicVariant) {
    return null
  }

  return (
    <>
      <div
        style={style}
        className={[styles.sidebar, className].filter(Boolean).join(' ')}
      >
        <div className={styles.sidebarTitle}>
          {t('products.dynamicVariant.titles.hierarchy')}
        </div>
        {hierarchyLoading || !treeNodes || treeNodes.length <= 0 ? (
          <div className={styles.spinnerWrapper}>
            <ProgressSpinner size="40px" />
          </div>
        ) : (
          <div className={styles.treeWrapper}>
            <Tree
              borderless
              value={treeNodes}
              expandedKeys={expandedKeys}
              onToggle={(e) => setExpandedKeys(e.value)}
              nodeTemplate={treeNodeTemplate}
            />
          </div>
        )}
      </div>

      <ConfirmBox
        visible={!!deleteNodeId}
        onAccept={confirmDelete}
        onReject={() => setDeleteNodeId(null)}
        loading={deleteLoading}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
        title={t('products.dynamicVariant.dialogs.deleteTreeNode.title')}
        message={t('products.dynamicVariant.dialogs.deleteTreeNode.text1', {
          name: product.name,
        })}
      >
        {variants.length > 0 ? (
          <div>
            {t('products.dynamicVariant.dialogs.deleteTreeNode.text2', {
              count: variants.length,
            })}
            <ul className={styles.deleteVariantsList}>
              {variants.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        ) : undefined}
      </ConfirmBox>

      <ConfirmBox
        visible={!!pendingNavKey || discardDraft}
        onAccept={() => {
          const target = pendingNavKey || parentVariantIdParam
          if (target) {
            navigate(productDetailPath(target))
          }
          setPendingNavKey(null)
          setDiscardDraft(false)
        }}
        onReject={() => {
          setPendingNavKey(null)
          setDiscardDraft(false)
        }}
        loading={false}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
        title={t('products.dynamicVariant.dialogs.discardDraft.title')}
        message={t('products.dynamicVariant.dialogs.discardDraft.text')}
      />
    </>
  )
}

export default DynamicVariantHierarchySidebar
