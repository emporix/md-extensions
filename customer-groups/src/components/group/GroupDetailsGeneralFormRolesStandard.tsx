import { useCallback, useMemo } from 'react'
import { Checkbox } from '@emporix/component-library'
import {
  GroupFormFields,
  ServiceType,
} from '../../helpers/groups/groupForm.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import { useGroupRole } from '../../context/GroupRole.provider'
import { AccessControl } from '../../models/Permissions.model'
import {
  getDcpAdministratorAccessControls,
  getEditorAccessControls,
  getManagerAccessControls,
  getOeAdministratorAccessControls,
  getViewerAccessControls,
} from '../../helpers/groups/accessControls.helpers'
import { RoleCode } from '../../models/Groups.model'
import styles from './GroupDetailsGeneralFormRolesStandard.module.scss'

const dcpRoles = [RoleCode.VIEWER, RoleCode.MANAGER, RoleCode.ADMINISTRATOR]
const oeRoles = [
  RoleCode.VIEWER,
  RoleCode.EDITOR,
  RoleCode.MANAGER,
  RoleCode.ADMINISTRATOR,
]

const GroupDetailsGeneralFormRolesStandard = () => {
  const { t } = useTranslation()
  const { setValue, control } = useFormContext<GroupFormFields>()
  const { activeServiceType, accessControlsByRole } = useGroupRole()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const currentAcs = useWatch<GroupFormFields, 'accessControls'>({
    control,
    name: 'accessControls',
  })

  const allRoleAcIds = useMemo(() => {
    return new Set([
      ...getViewerAccessControls(accessControlsByRole).map((ac) => ac.id),
      ...getEditorAccessControls(accessControlsByRole).map((ac) => ac.id),
      ...getManagerAccessControls(accessControlsByRole).map((ac) => ac.id),
      ...(activeServiceType === ServiceType.DCP
        ? getDcpAdministratorAccessControls
        : getOeAdministratorAccessControls)(accessControlsByRole).map(
        (ac) => ac.id
      ),
    ])
  }, [accessControlsByRole, activeServiceType])

  const isRoleChecked = useCallback(
    (role: RoleCode): boolean => {
      const currentAcSet = new Set(currentAcs ?? [])
      let roleAcs: AccessControl[] = []
      if (role === RoleCode.VIEWER)
        roleAcs = getViewerAccessControls(accessControlsByRole)
      else if (role === RoleCode.EDITOR)
        roleAcs = getEditorAccessControls(accessControlsByRole)
      else if (role === RoleCode.MANAGER)
        roleAcs = getManagerAccessControls(accessControlsByRole)
      else if (role === RoleCode.ADMINISTRATOR)
        roleAcs =
          activeServiceType === ServiceType.DCP
            ? getDcpAdministratorAccessControls(accessControlsByRole)
            : getOeAdministratorAccessControls(accessControlsByRole)
      const roleAcIds = roleAcs.map((ac) => ac.id)
      const currentRoleAcIds = [...currentAcSet].filter((id) =>
        allRoleAcIds.has(id)
      )
      return (
        roleAcIds.length > 0 &&
        currentRoleAcIds.length === roleAcIds.length &&
        roleAcIds.every((id) => currentAcSet.has(id))
      )
    },
    [accessControlsByRole, currentAcs, allRoleAcIds, activeServiceType]
  )

  const onCheckboxChange = useCallback(
    (role: RoleCode) => {
      let newAcs: AccessControl[] = []
      if (role === RoleCode.VIEWER) {
        newAcs = getViewerAccessControls(accessControlsByRole)
      } else if (role === RoleCode.EDITOR) {
        newAcs = getEditorAccessControls(accessControlsByRole)
      } else if (role === RoleCode.MANAGER) {
        newAcs = getManagerAccessControls(accessControlsByRole)
      } else if (role === RoleCode.ADMINISTRATOR) {
        newAcs =
          activeServiceType === ServiceType.DCP
            ? getDcpAdministratorAccessControls(accessControlsByRole)
            : getOeAdministratorAccessControls(accessControlsByRole)
      }
      setValue(
        'accessControls',
        newAcs.map((ac) => ac.id),
        { shouldDirty: true }
      )
    },
    [accessControlsByRole, activeServiceType]
  )

  return (
    <div className={styles.rolesList}>
      {activeServiceType === ServiceType.DCP
        ? dcpRoles.map((r) => (
            <div key={ServiceType.DCP + r} className={styles.roleRow}>
              <Checkbox
                inputId={r}
                disabled={!canManage}
                checked={isRoleChecked(r)}
                value={r}
                onChange={(e) =>
                  isRoleChecked(e.value as RoleCode)
                    ? setValue('accessControls', [], { shouldDirty: true })
                    : onCheckboxChange(e.value as RoleCode)
                }
              />
              <label htmlFor={r} className={styles.roleLabel}>
                {t(`usersAndGroups.groups.forms.group.role.labels.${r}`)}
              </label>
            </div>
          ))
        : oeRoles.map((r) => (
            <div key={ServiceType.OE + r} className={styles.roleRow}>
              <Checkbox
                inputId={r}
                disabled={!canManage}
                checked={isRoleChecked(r)}
                value={r}
                onChange={(e) =>
                  isRoleChecked(e.value as RoleCode)
                    ? setValue('accessControls', [], { shouldDirty: true })
                    : onCheckboxChange(e.value as RoleCode)
                }
              />
              <label htmlFor={r} className={styles.roleLabel}>
                {t(`usersAndGroups.groups.forms.group.role.labels.${r}`)}
              </label>
            </div>
          ))}
    </div>
  )
}

export default GroupDetailsGeneralFormRolesStandard
