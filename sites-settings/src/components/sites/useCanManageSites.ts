import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'

/** `Sites Manager` may create, edit and delete sites (MD). */
export const useCanManageSites = () => {
  const { hasPermission } = usePermissions()
  return hasPermission(EmployeeDomains.SITES_MANAGER)
}
