import TableActions from '../shared/TableActions'

type TableActionsProps = {
  readonly onEdit?: () => void
  readonly onDelete?: () => void
  readonly managerPermission?: boolean
}

const TaxConfigurationTableActions = ({
  onEdit,
  onDelete,
  managerPermission = true,
}: TableActionsProps) => {
  return (
    <TableActions
      managerPermission={managerPermission}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

export default TaxConfigurationTableActions
