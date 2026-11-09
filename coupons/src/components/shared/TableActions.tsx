import { ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { Menu, type MenuItem, type MenuRef } from '@emporix/component-library'
import { BsPencilFill, BsThreeDotsVertical, BsTrashFill } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { StylableProps } from '../../helpers/props'
import DeleteConfirmBox from './DeleteConfirmBox'
import styles from './TableActions.module.scss'

type DeleteConfirmConfig = {
  pluralsPath: string
  entity?: unknown
  entityLabel?: string
  actionText?: string
}

type TableActionsProps = StylableProps & {
  readonly actions?: CustomAction[]
  readonly menuActions?: CustomAction[]
  readonly onEdit?: () => void
  readonly editDisabled?: boolean
  readonly onDelete?: () => void | Promise<void>
  readonly deleteDisabled?: boolean
  readonly managerPermission?: boolean
  readonly disabled?: boolean
  readonly deleteConfirm?: DeleteConfirmConfig
}

type CustomAction = {
  icon: ReactNode
  onClick?: () => void
  tooltip?: string
  disabled?: boolean
  link?: string
  dataTestId?: string
}

const TableActionsButton = ({ item }: { readonly item: CustomAction }) => {
  return (
    <button
      type="button"
      data-testid={item.dataTestId}
      disabled={item.disabled}
      className={styles.iconButton}
      title={item.tooltip}
      aria-label={item.tooltip}
      onClick={(e) => {
        item.onClick?.()
        e.stopPropagation()
      }}
    >
      {item.icon}
    </button>
  )
}

const TableActions = ({
  className = '',
  onEdit,
  editDisabled = false,
  onDelete,
  deleteDisabled = false,
  actions = [],
  menuActions = [],
  managerPermission = true,
  disabled = false,
  deleteConfirm,
}: TableActionsProps) => {
  const { t } = useTranslation()
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menu = useRef<MenuRef>(null)

  const handleDeleteClick = useCallback(() => {
    if (deleteConfirm && onDelete) {
      setConfirmVisible(true)
    } else {
      onDelete?.()
    }
  }, [deleteConfirm, onDelete])

  const handleConfirmAccept = useCallback(async () => {
    if (!onDelete) return
    try {
      setIsDeleting(true)
      await onDelete()
    } finally {
      setIsDeleting(false)
      setConfirmVisible(false)
    }
  }, [onDelete])

  const { shownItems, hiddenItems } = useMemo(() => {
    let shown: CustomAction[] = []
    let hidden: CustomAction[]
    if (onEdit) {
      shown.push({
        icon: <BsPencilFill data-test-id="edit-button" size={16} />,
        onClick: onEdit,
        tooltip: t('global.edit'),
        disabled: disabled || editDisabled,
      })
    }
    if (onDelete) {
      shown.push({
        icon: <BsTrashFill data-test-id="delete-button" size={16} />,
        onClick: handleDeleteClick,
        tooltip: t('global.delete'),
        disabled: !managerPermission || disabled || deleteDisabled,
      })
    }
    if (shown.length + actions.length > 4) {
      const firstThreeItems = [...shown]
      const restItems: CustomAction[] = []
      actions.forEach((action) => {
        if (firstThreeItems.length < 3) {
          firstThreeItems.unshift(action)
        } else {
          restItems.push(action)
        }
      })
      shown = firstThreeItems
      hidden = [...restItems, ...menuActions]
    } else {
      shown = [...actions, ...shown]
      hidden = [...menuActions]
    }
    return { shownItems: shown, hiddenItems: hidden }
  }, [
    actions,
    menuActions,
    onDelete,
    onEdit,
    managerPermission,
    disabled,
    t,
    handleDeleteClick,
    editDisabled,
    deleteDisabled,
  ])

  const hiddenMenuItems = useMemo<MenuItem[]>(
    () =>
      hiddenItems.map((item, idx) => ({
        label: item.tooltip ?? `${t('global.action')} ${idx + 1}`,
        icon: item.icon,
        disabled: item.disabled,
        command: (event) => {
          event.originalEvent.stopPropagation()
          if (item.link) {
            window.open(item.link, '_blank', 'noopener,noreferrer')
            return
          }
          item.onClick?.()
        },
      })),
    [hiddenItems, t]
  )

  return (
    <div
      className={[styles.actions, className].filter(Boolean).join(' ')}
      onClick={(e) => e.stopPropagation()}
    >
      {shownItems.map((item, idx) => (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          key={`shown-${idx}`}
          onClick={(e) => e.preventDefault()}
        >
          <TableActionsButton item={item} />
        </a>
      ))}
      {hiddenItems.length > 0 && (
        <>
          <button
            type="button"
            key="menuActions"
            className={styles.iconButton}
            onClick={(e) => menu.current?.toggle(e)}
            aria-controls="menuActions"
            aria-haspopup
            aria-label={t('global.more')}
          >
            <BsThreeDotsVertical size={18} aria-hidden />
          </button>
          <Menu
            className={styles.menuPanel}
            model={hiddenMenuItems}
            popup
            ref={menu}
            id="menuActions"
          />
        </>
      )}
      {deleteConfirm && onDelete && (
        <DeleteConfirmBox
          visible={confirmVisible}
          onAccept={handleConfirmAccept}
          onReject={() => setConfirmVisible(false)}
          loading={isDeleting}
          pluralsPath={deleteConfirm.pluralsPath}
          entity={deleteConfirm.entity}
          entityLabel={deleteConfirm.entityLabel}
          actionText={deleteConfirm.actionText}
        />
      )}
    </div>
  )
}

export default TableActions
