import { ReactNode, useMemo } from 'react'
import {
  TableActions as ClTableActions,
  type TableAction,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { StylableProps } from '../../helpers/props'
import { useDeleteConfirmTexts } from './useDeleteConfirmTexts'

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

/**
 * MD `TableActions` props on top of the component library's `TableActions`
 * (look and behaviour live there): supplies the translated labels, the delete
 * confirmation texts and maps `managerPermission` to the delete button.
 */
const TableActions = ({
  className = '',
  actions = [],
  menuActions = [],
  managerPermission = true,
  deleteDisabled = false,
  deleteConfirm,
  ...props
}: TableActionsProps) => {
  const { t } = useTranslation()
  const confirmTexts = useDeleteConfirmTexts({
    pluralsPath: deleteConfirm?.pluralsPath ?? 'global',
    entity: deleteConfirm?.entity,
    entityLabel: deleteConfirm?.entityLabel,
    actionText: deleteConfirm?.actionText,
  })

  const toClAction = useMemo(
    () =>
      (action: CustomAction, index: number): TableAction => ({
        icon: action.icon,
        label: action.tooltip ?? `${t('global.action')} ${index + 1}`,
        onClick: action.onClick,
        disabled: action.disabled,
        link: action.link,
        'data-testid': action.dataTestId,
      }),
    [t]
  )

  return (
    <ClTableActions
      {...props}
      className={className}
      actions={actions.map(toClAction)}
      menuActions={menuActions.map(toClAction)}
      deleteDisabled={!managerPermission || deleteDisabled}
      deleteConfirm={deleteConfirm ? confirmTexts : undefined}
      labels={{
        edit: t('global.edit'),
        delete: t('global.delete'),
        more: t('global.more'),
      }}
    />
  )
}

export default TableActions
