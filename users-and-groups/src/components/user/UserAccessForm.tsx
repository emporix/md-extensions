import { useEffect, useState } from 'react'
import FormGridRow from '../../components/shared/FormGridRow'
import { Controller, useFormContext } from 'react-hook-form'
import FormGrid from '../../components/shared/FormGrid'
import { useTranslation } from 'react-i18next'
import { Group } from '../../models/Groups.model'
import { getApiErrorDetails } from '../../helpers/api'
import { useIamApi } from '../../hooks/api/iam'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useParams } from 'react-router'
import { formatDateWithTime } from '../../helpers/date'
import { Dropdown, InputText, useToast } from '@emporix/component-library'
import { UserFormFields } from '../../helpers/users/users.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { useEntraIdGroupsSync } from '../../hooks/useEntraIdGroupsSync'
import styles from './UserAccessForm.module.scss'

const UserAccessForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<UserFormFields>()
  const { getAllGroups } = useIamApi()
  const { getContentLangValue } = useLocalizedValue()
  const { showError } = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const { areManualMutationsRestricted } = useEntraIdGroupsSync()
  const canAssignGroups = canManage && !areManualMutationsRestricted

  const { userId } = useParams()
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    ;(async () => {
      await loadGroups()
    })()
  }, [])

  const loadGroups = async () => {
    try {
      const groups = await getAllGroups()
      setGroups(groups.values)
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.users.toasts.fetchGroups.error'),
        getApiErrorDetails(e)
      )
    }
  }

  return (
    <FormGrid>
      <FormGridRow>
        <Controller
          name="groupIds"
          control={control}
          render={({ field }) => (
            <Dropdown
              className={styles.groupsField}
              label={t('usersAndGroups.users.forms.user.userGroups')}
              filter
              multiple
              display="chip"
              disabled={!canAssignGroups}
              value={field.value ?? []}
              onChange={(e) => {
                field.onChange(e.value)
              }}
              options={groups
                ?.map((g) => ({
                  label: getContentLangValue(g.name),
                  value: g.id,
                }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              optionLabel="label"
              optionValue="value"
            />
          )}
        />
      </FormGridRow>

      {userId && (
        <FormGridRow>
          <Controller
            name="validFrom"
            control={control}
            render={({ field }) => (
              <InputText
                className={styles.validFromField}
                label={t('usersAndGroups.users.forms.user.validFrom')}
                disabled
                readOnly
                value={formatDateWithTime(field.value)}
              />
            )}
          />
        </FormGridRow>
      )}
    </FormGrid>
  )
}

export default UserAccessForm
