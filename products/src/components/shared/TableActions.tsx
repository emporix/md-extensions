import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { BsPencilFill, BsThreeDotsVertical, BsTrashFill } from 'react-icons/bs'
import TooltipOptions from 'primereact/tooltip/tooltipoptions'
import { useTranslation } from 'react-i18next'
import { Menu } from 'primereact/menu'

interface TableActionsProps {
  className: string
  actions: CustomAction[]
  menuActions: CustomAction[]
  onEdit?: () => void
  onDelete?: () => void
  managerPermission?: boolean
  disabled?: boolean
}

interface CustomAction {
  icon: JSX.Element
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
      style: { fontSize: '0.75rem' },
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
    className,
    onEdit,
    onDelete,
    actions,
    menuActions,
    managerPermission,
    disabled,
  } = props
  const { t } = useTranslation()
  const menu = useRef<Menu>(null)
  const [shownItems, setShownItems] = useState<CustomAction[]>([])
  const [hiddenItems, setHiddenItems] = useState<CustomAction[]>([])

  useEffect(() => {
    let shownItems: CustomAction[] = []
    let hiddenItems: CustomAction[]
    if (onEdit) {
      shownItems.push({
        icon: <BsPencilFill data-test-id="edit-button" size={16} />,
        onClick: onEdit,
        tooltip: t('global.edit'),
        disabled: disabled,
      })
    }
    if (onDelete) {
      shownItems.push({
        icon: <BsTrashFill data-test-id="delete-button" size={16} />,
        onClick: onDelete,
        tooltip: t('global.delete'),
        disabled: !managerPermission || disabled,
      })
    }
    if (shownItems.length + actions.length > 4) {
      const firstThreeItems = [...shownItems]
      const restItems: CustomAction[] = []
      actions.forEach((a) => {
        if (firstThreeItems.length < 3) {
          firstThreeItems.unshift(a)
        } else {
          restItems.push(a)
        }
      })
      shownItems = firstThreeItems
      hiddenItems = [...restItems, ...menuActions]
    } else {
      shownItems = [...actions, ...shownItems]
      hiddenItems = [...menuActions]
    }
    setShownItems(shownItems)
    setHiddenItems(hiddenItems)
  }, [actions, menuActions, onDelete, onEdit, managerPermission, disabled])

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
            onClick={(event) => menu.current?.toggle(event)}
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
    </div>
  )
}

TableActions.defaultProps = {
  className: '',
  actions: [],
  menuActions: [],
  managerPermission: true,
  disabled: false,
}

export default TableActions
