import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DotIndicator,
  IconButton,
  Menu,
  type MenuItem,
  type MenuRef,
  type TreeNode,
} from '@emporix/component-library'
import {
  BsArrow90DegRight,
  BsArrowBarRight,
  BsArrowReturnRight,
  BsFillPlusCircleFill,
} from 'react-icons/bs'
import { AddCategoryTarget } from './categoriesTree.helpers'
import styles from './CategoryTree.module.scss'

type CategoryNodeTemplateProps = {
  readonly node: TreeNode
  /** The CL `Tree` node class; compact nodes need it on the label text. */
  readonly labelClassName?: string
  readonly onAdd: (node: TreeNode, target: AddCategoryTarget) => void
}

/**
 * Ported from management-dashboard `CategoryNodeTemplate`: the status dot, the
 * label and, while the row is hovered or focused, the add menu (above, child,
 * below). PrimeReact `Button` + `Menu` templates became CL `IconButton` +
 * `Menu` items; the react-icons glyphs are MD's.
 */
const CategoryNodeTemplate = ({
  node,
  labelClassName,
  onAdd,
}: CategoryNodeTemplateProps) => {
  const { t } = useTranslation()
  const nodeRef = useRef<HTMLDivElement>(null)
  const addMenu = useRef<MenuRef>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // The actions show while the whole row is hovered, its toggler included,
  // or while the row has keyboard focus.
  useEffect(() => {
    const row = nodeRef.current?.closest<HTMLElement>('.p-treenode-content')
    if (!row) return
    const show = () => setIsHovered(true)
    const hide = () => setIsHovered(false)
    // Focus from a mouse click would otherwise keep the actions on the row.
    const focus = ({ target }: FocusEvent) =>
      setIsFocused(
        target instanceof Element && target.matches(':focus-visible')
      )
    const blur = ({ relatedTarget }: FocusEvent) => {
      if (!(relatedTarget instanceof Node && row.contains(relatedTarget))) {
        setIsFocused(false)
      }
    }
    row.addEventListener('mouseenter', show)
    row.addEventListener('mouseleave', hide)
    row.addEventListener('focusin', focus)
    row.addEventListener('focusout', blur)
    return () => {
      row.removeEventListener('mouseenter', show)
      row.removeEventListener('mouseleave', hide)
      row.removeEventListener('focusin', focus)
      row.removeEventListener('focusout', blur)
    }
  }, [])

  const openAddMenu = (event: MouseEvent<HTMLButtonElement>) => {
    // The button is part of the node, so the click would also select it.
    event.stopPropagation()
    setIsMenuOpen(true)
    addMenu.current?.toggle(event)
  }

  const addItem = (
    target: AddCategoryTarget,
    label: string,
    icon: MenuItem['icon']
  ): MenuItem => ({
    label,
    icon,
    command: ({ originalEvent }) => {
      originalEvent.stopPropagation()
      addMenu.current?.hide()
      onAdd(node, target)
    },
  })

  const addMenuItems: MenuItem[] = [
    addItem(
      'above',
      t('categories.tree.addAbove'),
      <BsArrow90DegRight size={16} />
    ),
    addItem(
      'child',
      t('categories.tree.addChild'),
      <BsArrowBarRight size={16} />
    ),
    addItem(
      'below',
      t('categories.tree.addBelow'),
      <BsArrowReturnRight size={16} />
    ),
  ]

  return (
    <div ref={nodeRef} className={styles.node}>
      <div className={styles.nodeLabel}>
        <DotIndicator value={!!node.data?.published} />
        <span className={labelClassName}>{node.label}</span>
      </div>
      {(isHovered || isFocused || isMenuOpen) && (
        <div className={styles.nodeActions}>
          <IconButton
            icon={<BsFillPlusCircleFill size={14} />}
            ariaLabel={t('categories.addNewCategory')}
            tooltip={t('categories.addNewCategory')}
            ariaHasPopup="menu"
            onClick={openAddMenu}
            data-testid={`category-node-add-${String(node.key)}`}
          />
          <Menu
            popup
            ref={addMenu}
            model={addMenuItems}
            onHide={() => setIsMenuOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

export default CategoryNodeTemplate
