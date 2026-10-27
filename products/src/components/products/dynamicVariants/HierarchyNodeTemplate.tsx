import { useMemo, useRef } from 'react'
import {
  Menu,
  type MenuItem,
  type MenuRef,
  type TreeNode,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { HierarchyNodeData } from '../../../helpers/dynamicVariants/hierarchy.helpers'
import { StylableProps } from '../../../helpers/props'
import { useActiveNode } from '../../../context/ActiveNodeProvider'
import { useProductData } from '../../../context/ProductDataProvider'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { BsPlusLg, BsTrash } from 'react-icons/bs'
import styles from './DynamicVariant.module.scss'

interface Props extends StylableProps {
  readonly node: TreeNode
  readonly canManage: boolean
  readonly onSelect: (nodeKey: string) => void
  readonly onAddChild: (nodeKey: string) => void
  readonly onAddSibling: (siblingKey: string, parentKey: string) => void
  readonly onDelete: (nodeKey: string) => void
}

const HierarchyNodeTemplate = (props: Props) => {
  const {
    className = '',
    style,
    node,
    canManage,
    onSelect,
    onAddChild,
    onAddSibling,
    onDelete,
  } = props
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const { activeNodeState } = useActiveNode()
  const { product } = useProductData()

  const addMenu = useRef<MenuRef>(null)
  const data = node.data as HierarchyNodeData | undefined
  const isRoot = data?.nodeKind === 'root'
  const isDraft = data?.nodeKind === 'draft'
  const isActiveNode = product?.id === node.key || isDraft

  const display = useMemo(() => {
    const defaultName = data?.displayName || '--'
    const name = isActiveNode
      ? getContentLangValue(activeNodeState.name || defaultName)
      : defaultName

    const defaultCode = data?.code || '--'
    const code = isActiveNode
      ? activeNodeState.code || defaultCode
      : defaultCode

    const defaultType = data?.dynamicVariantType || '--'
    const type = isActiveNode
      ? activeNodeState.dynamicVariantType || defaultType
      : defaultType

    const published = isActiveNode
      ? (activeNodeState.published ?? data?.published)
      : data?.published
    const sellable = isActiveNode
      ? (activeNodeState.sellable ?? data?.sellable)
      : data?.sellable

    return { name, code, type, published, sellable }
  }, [isActiveNode, activeNodeState, data, getContentLangValue])

  const publishedSellableTemplate = useMemo(() => {
    const options = [
      display.published && t('products.dynamicVariant.labels.published'),
      display.sellable && t('products.dynamicVariant.labels.sellable'),
    ]
    return options.filter(Boolean).map((text) => {
      const label = text as string
      return (
        <div
          key={label}
          className={styles.nodeBadge}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            const span = e.currentTarget.querySelector('span')
            if (span) span.textContent = label
          }}
          onMouseLeave={(e) => {
            const span = e.currentTarget.querySelector('span')
            if (span) span.textContent = label.charAt(0)
          }}
        >
          <span>{label.charAt(0)}</span>
        </div>
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, display.published, display.sellable])

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        label: t('products.dynamicVariant.labels.addChild'),
        command: () => {
          if (!node.key) return
          onAddChild(String(node.key))
        },
      },
      {
        label: t('products.dynamicVariant.labels.addSibling'),
        visible: !isRoot,
        command: () => {
          if (!data?.parentId || !node.key) return
          onAddSibling(String(node.key), data.parentId)
        },
      },
    ],
    [node.key, isRoot, data?.parentId, onAddChild, onAddSibling, t]
  )

  const nodeClassName = [
    styles.node,
    isActiveNode ? styles.nodeActive : '',
    isDraft ? styles.nodeDraft : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.nodeRow}>
      <div
        style={style}
        className={nodeClassName}
        onClick={() => onSelect(String(node.key))}
      >
        <div className={styles.nodeHeader}>
          <div className={styles.nodeType}>
            {display.type ||
              (isRoot
                ? t('products.dynamicVariant.labels.product')
                : t('products.dynamicVariant.labels.variant'))}
          </div>
          {isActiveNode && canManage && (
            <div
              className={styles.nodeActions}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {!isDraft && (
                <>
                  <div
                    onClick={(e) => addMenu.current?.toggle(e)}
                    aria-controls="menuActions"
                    aria-haspopup
                  >
                    <BsPlusLg className={styles.icon} size={16} />
                  </div>
                  <Menu
                    className={styles.addMenu}
                    model={menuItems}
                    popup
                    ref={addMenu}
                    id="menuActions"
                  />
                </>
              )}
              <BsTrash
                className={styles.icon}
                size={16}
                onClick={() => {
                  if (!node.key) return
                  onDelete(String(node.key))
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.nodeName} title={display.name}>
          {display.name}
        </div>
        <div className={styles.nodeCodeRow}>
          <div className={styles.nodeCode} title={data?.code}>
            {display.code}
          </div>
          <div className={styles.nodeBadges}>{publishedSellableTemplate}</div>
        </div>
      </div>
      <div className={styles.nodeSpacer} />
    </div>
  )
}

export default HierarchyNodeTemplate
