import {
  GroupFormFields,
  RoleType,
  ServiceType,
} from '../../helpers/groups/groupForm.helpers'
import { Dropdown } from '@emporix/component-library'
import { getArrayFromEnum } from '../../helpers/utils'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { useGroupRole } from '../../context/GroupRole.provider'
import { useFormContext } from 'react-hook-form'

const GroupDetailsGeneralFormRolesServicePicker = (props: StylableProps) => {
  const { className = '' } = props
  const { t } = useTranslation()
  const { setValue } = useFormContext<GroupFormFields>()

  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const { activeRoleType, activeServiceType, setActiveServiceType } =
    useGroupRole()

  return (
    <div className={`${className}`}>
      <Dropdown
        disabled={!canManage || activeRoleType === RoleType.VENDOR}
        options={getArrayFromEnum(ServiceType).map((st) => ({
          label: t(`usersAndGroups.groups.labels.${st}`),
          value: st,
        }))}
        value={activeServiceType}
        onChange={(e) => {
          setValue('dcpTemplates', [])
          setValue('oeTemplates', [])
          setActiveServiceType(e.value as ServiceType)
        }}
      />
    </div>
  )
}

export default GroupDetailsGeneralFormRolesServicePicker
