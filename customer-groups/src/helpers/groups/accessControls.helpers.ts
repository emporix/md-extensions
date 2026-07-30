import { AccessControl } from '../../models/Permissions.model'
import {
  EMPLOYEE_ADMIN_DOMAINS,
  EMPLOYEE_DOMAINS,
  EmployeeDomains,
  OE_DOMAINS,
} from '../../configs/accessControls'
import { AccessControlsTemplate } from '../../configs/accessControlsTemplates'
import { getAccessControlsFromDomain } from '../../helpers/accessControls'

const acIdsForRole = (roleKeyword: string): Set<string> =>
  new Set(
    [...EMPLOYEE_DOMAINS, ...OE_DOMAINS]
      .filter((d) => d.id.includes(roleKeyword))
      .flatMap((d) => d.accessControls)
  )

const filterByIds = (
  accessControls: AccessControl[],
  ids: Set<string>
): AccessControl[] => accessControls.filter((ac) => ids.has(ac.id))

export const getViewerAccessControls = (accessControls: AccessControl[]) => {
  const ids = acIdsForRole('Viewer')
  const extraIds = new Set([
    ...getAccessControlsFromDomain(EmployeeDomains.USERS_AND_GROUPS_VIEWER),
    ...getAccessControlsFromDomain(EmployeeDomains.WEBHOOKS_VIEWER),
    ...getAccessControlsFromDomain(EmployeeDomains.EXTENSIONS_VIEWER),
  ])
  return filterByIds(accessControls, new Set([...ids, ...extraIds]))
}

export const getEditorAccessControls = (accessControls: AccessControl[]) => {
  const ids = acIdsForRole('Editor')
  return filterByIds(accessControls, ids)
}

export const getManagerAccessControls = (accessControls: AccessControl[]) => {
  const ids = acIdsForRole('Manager')
  const extraIds = new Set([
    ...getAccessControlsFromDomain(EmployeeDomains.USERS_AND_GROUPS_VIEWER),
    ...getAccessControlsFromDomain(EmployeeDomains.WEBHOOKS_MANAGER),
    ...getAccessControlsFromDomain(EmployeeDomains.EXTENSIONS_VIEWER),
  ])
  return filterByIds(accessControls, new Set([...ids, ...extraIds]))
}

export const getOeAdministratorAccessControls = (
  accessControls: AccessControl[]
) => {
  const ids = acIdsForRole('Administrator')
  return filterByIds(accessControls, ids)
}

export const getDcpAdministratorAccessControls = (
  accessControls: AccessControl[]
) => {
  const ids = new Set([
    ...acIdsForRole('Manager'),
    ...EMPLOYEE_ADMIN_DOMAINS.filter((d) => d.id.includes('Manager')).flatMap(
      (d) => d.accessControls
    ),
  ])
  return filterByIds(accessControls, ids)
}

export const mapAccessControlsToTemplates = (
  accessControls: string[],
  templates: AccessControlsTemplate[]
) => {
  const acSet = new Set(accessControls)
  const isSelected = (t: AccessControlsTemplate) =>
    t.accessControls.length > 0 && t.accessControls.every((ac) => acSet.has(ac))
  return templates.filter(isSelected)
}
