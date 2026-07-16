import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RadioButton } from '@emporix/component-library'
import { getArrayFromEnum } from '../../helpers/utils'
import GroupDetailsGeneralFormRolesStandard from './GroupDetailsGeneralFormRolesStandard'
import GroupDetailsGeneralFormRolesTemplates from './GroupDetailsGeneralFormRolesTemplates'
import {
  GroupFormFields,
  RoleType,
  ServiceType,
} from '../../helpers/groups/groupForm.helpers'
import GroupDetailsGeneralFormRolesServicePicker from './GroupDetailsGeneralFormRolesServicePicker'
import { useGroupData } from '../../context/Group.provider'
import { useGroupRole } from '../../context/GroupRole.provider'
import GroupDetailsGeneralFormRolesVendor from './GroupDetailsGeneralFormRolesVendor'
import { usePermissions } from '../../context/PermissionsProvider'
import { useFormContext } from 'react-hook-form'
import styles from './GroupDetailsGeneralFormRoles.module.scss'

const GroupDetailsGeneralFormRoles = () => {
  const { t } = useTranslation()

  const { accessControlsForOe } = usePermissions()
  const { group } = useGroupData()
  const { activeRoleType, switchRoleType } = useGroupRole()
  const { setValue, getValues } = useFormContext<GroupFormFields>()

  const { setActiveRoleType, setActiveServiceType } = useGroupRole()

  useEffect(() => {
    if (!group) return
    let roleType = RoleType.STANDARD
    if (group.templates?.length > 0) {
      roleType = RoleType.TEMPLATES
    } else if (group.vendorId) {
      roleType = RoleType.VENDOR
    }
    setActiveRoleType(roleType)
  }, [group])

  const handleRoleTypeChange = (roleType: RoleType) => {
    if (roleType === RoleType.VENDOR) {
      setActiveServiceType(ServiceType.DCP)
    }
    const restoredState = switchRoleType(roleType, {
      accessControls: getValues('accessControls'),
      dcpTemplates: getValues('dcpTemplates'),
      oeTemplates: getValues('oeTemplates'),
      vendorId: getValues('vendorId'),
    })
    setValue('accessControls', restoredState?.accessControls ?? [], {
      shouldDirty: true,
    })
    setValue(
      'dcpTemplates',
      roleType === RoleType.TEMPLATES
        ? (restoredState?.dcpTemplates ?? [])
        : [],
      {
        shouldDirty: true,
      }
    )
    setValue(
      'oeTemplates',
      roleType === RoleType.TEMPLATES ? (restoredState?.oeTemplates ?? []) : [],
      {
        shouldDirty: true,
      }
    )
    setValue('vendorId', restoredState?.vendorId ?? '', { shouldDirty: true })
  }

  return (
    <div className={styles.rolesLayout}>
      <div className={styles.roleTypeList}>
        {getArrayFromEnum(RoleType)
          .filter((rt) => {
            if (rt === RoleType.VENDOR) {
              return !group?.id || group?.vendorId
            }
            return true
          })
          .map((rt) => (
            <div key={rt} className={styles.roleTypeOption}>
              <RadioButton
                inputId={rt}
                name="roleType"
                value={rt}
                label={t('usersAndGroups.groups.forms.group.role.labels.' + rt)}
                disabled={!!group?.vendorId}
                checked={activeRoleType === rt}
                onChange={() => handleRoleTypeChange(rt)}
                className={styles.roleTypeRadio}
              />
            </div>
          ))}
      </div>
      <div className={styles.roleDetails}>
        {accessControlsForOe?.length > 0 && (
          <GroupDetailsGeneralFormRolesServicePicker
            className={styles.servicePicker}
          />
        )}
        {activeRoleType === RoleType.STANDARD && (
          <GroupDetailsGeneralFormRolesStandard />
        )}
        {activeRoleType === RoleType.TEMPLATES && (
          <GroupDetailsGeneralFormRolesTemplates />
        )}
        {activeRoleType === RoleType.VENDOR && (
          <GroupDetailsGeneralFormRolesVendor />
        )}
      </div>
    </div>
  )
}

export default GroupDetailsGeneralFormRoles
