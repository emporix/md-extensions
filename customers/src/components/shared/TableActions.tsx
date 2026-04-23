import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { BsPencilFill, BsThreeDotsVertical, BsTrashFill } from 'react-icons/bs'
import TooltipOptions from 'primereact/tooltip/tooltipoptions'
import { useTranslation } from 'react-i18next'
import { Menu } from 'primereact/menu'
import { StylableProps } from 'helpers/props'
import DeleteConfirmBox from './DeleteConfirmBox'

interface DeleteConfirmConfig {
  pluralsPath: string
  entity?: unknown
  entityLabel?: string
  actionText?: string
}

interface TableActionsProps extends StylableProps {
  actions?: CustomAction[]
  menuActions?: CustomAction[]
  onEdit?: () => void
  onDelete?: () => void | Promise<void>
  managerPermission?: boolean
  disabled?: boolean
  deleteConfirm?: DeleteConfirmConfig
}

interface CustomAction {
  icon: ReactNode
  onClick?: () => void
  tooltip?: string
  disabled?: boolean
  link?: string
  dataTestId?: string
}

const TableActionsButton = (props: { item: CustomAction }) => {
  const { item } = props
  const tooltipOptions: TooltipOptions = useMemo(() => {
    return {
      showOnDisabled: true,
      style: { fontSize: '0.75rem', textAlign: 'center' },
      position: 'top',
      showDelay: 1000,
    }
  }, [])

  return (
    <>
      <Button
        data-test-id={item.dataTestId}
        disabled={item.disabled}
        className="p-button-text"
        tooltip={item.tooltip}
        tooltipOptions={tooltipOptions}
        icon={item.icon}
        onClick={(e) => {
          item.onClick && item.onClick()
          e.stopPropagation()
        }}
      />
    </>
  )
}

const TableActions = (props: TableActionsProps) => {
  const {
    onEdit,
    onDelete,
    className = '',
    actions = [],
    menuActions = [],
    managerPermission = true,
    disabled = false,
    deleteConfirm,
  } = props
  const { t } = useTranslation()

  const [confirmVisible, setConfirmVisible] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menu = useRef<Menu>(null)

  const handleDeleteClick = useCallback(() => {
    if (deleteConfirm && onDelete) {
      setConfirmVisible(true)
    } else if (onDelete) {
      onDelete()
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
        disabled: disabled,
      })
    }
    if (onDelete) {
      shown.push({
        icon: <BsTrashFill data-test-id="delete-button" size={16} />,
        onClick: handleDeleteClick,
        tooltip: t('global.delete'),
        disabled: !managerPermission || disabled,
      })
    }
    if (shown.length + actions.length > 4) {
      const firstThreeItems = [...shown]
      const restItems: CustomAction[] = []
      actions.forEach((a) => {
        if (firstThreeItems.length < 3) {
          firstThreeItems.unshift(a)
        } else {
          restItems.push(a)
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
  ])

  return (
    <div
      className={`${className} flex justify-content-end align-items-center px-3`}
      onClick={(e) => e.stopPropagation()}
    >
      {shownItems.map((i, idx) => (
        <a
          href={i.link}
          target="_blank"
          rel="noreferrer"
          key={'shown' + idx}
          onClick={(e) => e.preventDefault()}
        >
          <TableActionsButton item={i} />
        </a>
      ))}
      {hiddenItems.length > 0 && (
        <>
          <Button
            key={'menuActions'}
            className={`p-button-text`}
            icon={<BsThreeDotsVertical size={18} />}
            onClick={(e) => menu.current?.toggle(e)}
            aria-controls="menuActions"
            aria-haspopup
          />
          <Menu
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '2.5rem',
              padding: '0.25rem',
            }}
            model={hiddenItems.map((i, idx) => ({
              template: (
                <a
                  href={i.link}
                  target="_blank"
                  rel="noreferrer"
                  key={'hidden' + idx}
                  onClick={(e) => e.preventDefault()}
                >
                  <TableActionsButton item={i} />
                </a>
              ),
            }))}
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
