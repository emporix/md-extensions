import TableActions from '../shared/TableActions'

interface TableActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  managerPermission?: boolean
}

const TaxConfigurationTableActions = ({
  onEdit,
  onDelete,
  managerPermission,
}: TableActionsProps) => {
  return (
    <TableActions
      managerPermission={managerPermission}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

TaxConfigurationTableActions.defaultProps = {
  managerPermission: true,
}

export default TaxConfigurationTableActions
