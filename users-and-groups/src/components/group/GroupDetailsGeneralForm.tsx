import { useEffect, useMemo, useState } from 'react'
import FormGridRow from '../../components/shared/FormGridRow'
import { Controller, useFormContext } from 'react-hook-form'
import FormGrid from '../../components/shared/FormGrid'
import { useTranslation } from 'react-i18next'
import { FiInfo } from 'react-icons/fi'
import { GroupFormFields } from '../../helpers/groups/groupForm.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import GroupDetailsGeneralFormRoles from './GroupDetailsGeneralFormRoles'
import { Dropdown, InputText } from '@emporix/component-library'
import { GroupUserTypes } from '../../models/Groups.model'
import { useGroupData } from '../../context/Group.provider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useConfigurationApi } from '../../hooks/api/configuration'
import SectionBox from '../../components/shared/SectionBox'
import inputFieldStyles from '../../components/shared/InputField.module.scss'
import styles from './GroupDetailsGeneralForm.module.scss'

type GroupDetailsGeneralFormProps = {
  readonly groupId?: string
}

type RestrictionOption = {
  value: string
  label: string
  deprecated: boolean
}

const GroupDetailsGeneralForm = ({ groupId }: GroupDetailsGeneralFormProps) => {
  const { t } = useTranslation()
  const { control, watch } = useFormContext<GroupFormFields>()
  const { hasPermission } = usePermissions()
  const { contentLanguage } = useDashboardContext()
  const selectedRestrictions = watch('restrictions')
  const { getRestrictions, getSyncBetweenRestrictionsAndSiteCodes } =
    useConfigurationApi()
  const { groupType, isPredefinedGroup } = useGroupData()

  const [restrictions, setRestrictions] = useState<string[]>([])
  const [isSyncEnabled, setIsSyncEnabled] = useState(false)

  const restrictionOptions = useMemo(() => {
    const options: RestrictionOption[] = []
    const availableRestrictions = new Set(restrictions)

    restrictions.forEach((restriction) => {
      options.push({
        value: restriction,
        label: restriction,
        deprecated: false,
      })
    })

    if (selectedRestrictions && Array.isArray(selectedRestrictions)) {
      selectedRestrictions.forEach((selected) => {
        if (!availableRestrictions.has(selected)) {
          options.push({
            value: selected,
            label: `${selected} (removed)`,
            deprecated: true,
          })
        }
      })
    }

    return options
  }, [restrictions, selectedRestrictions])

  const fetchRestrictions = async () => {
    try {
      const fetchedRestrictions = await getRestrictions()
      const restrictionsArray = fetchedRestrictions?.value ?? []
      setRestrictions(Array.isArray(restrictionsArray) ? restrictionsArray : [])
    } catch (error) {
      console.error('Error fetching restrictions:', error)
      setRestrictions([])
    }
  }

  const fetchSyncConfig = async () => {
    try {
      const syncConfig = await getSyncBetweenRestrictionsAndSiteCodes()
      setIsSyncEnabled(Boolean(syncConfig?.value))
    } catch (error) {
      console.error('Error fetching sync config:', error)
      setIsSyncEnabled(false)
    }
  }

  useEffect(() => {
    void fetchRestrictions()
    void fetchSyncConfig()
  }, [])

  const canManage = useMemo(() => {
    if (isPredefinedGroup) return false
    return hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  }, [isPredefinedGroup, hasPermission])

  return (
    <FormGrid>
      <FormGridRow>
        <Controller
          name="id"
          control={control}
          defaultValue={undefined}
          render={({ field: { value, onChange, ...field } }) => (
            <InputText
              className={styles.identifierField}
              label={t('usersAndGroups.groups.forms.group.id')}
              tooltip={t('usersAndGroups.groups.forms.group.tooltip.id')}
              value={value ?? ''}
              disabled={!canManage || groupId !== undefined}
              onChange={(e) => onChange(e.target.value)}
              {...field}
            />
          )}
        />
      </FormGridRow>
      <FormGridRow>
        <Controller
          name="name"
          control={control}
          rules={{
            required: true,
            validate: (value) =>
              Object.values(value ?? {}).some(
                (val) => val && val.trim() !== ''
              ),
          }}
          render={({ field: { value, onChange, ...field } }) => (
            <InputText
              className={styles.nameField}
              inputId="group-name"
              label={t('usersAndGroups.groups.forms.group.name')}
              required
              value={value?.[contentLanguage] ?? ''}
              disabled={!canManage}
              onChange={(e) =>
                onChange({
                  ...(value ?? {}),
                  [contentLanguage]: e.target.value,
                })
              }
              {...field}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <InputText
              className={styles.descriptionField}
              inputId="group-description"
              label={t('usersAndGroups.groups.forms.group.description')}
              value={value?.[contentLanguage] ?? ''}
              disabled={!canManage}
              onChange={(e) =>
                onChange({
                  ...(value ?? {}),
                  [contentLanguage]: e.target.value,
                })
              }
              {...field}
            />
          )}
        />
      </FormGridRow>
      <FormGridRow>
        <div
          className={`${inputFieldStyles.field} ${styles.restrictionsField}`}
        >
          <label className={inputFieldStyles.label}>
            {t(
              isSyncEnabled
                ? 'usersAndGroups.groups.forms.group.sites'
                : 'usersAndGroups.groups.forms.group.restrictions'
            )}
            {restrictions.length === 0 && (
              <span
                className={inputFieldStyles.tooltipIcon}
                title={t(
                  'usersAndGroups.groups.forms.group.tooltip.restrictionsEmpty'
                )}
                aria-label={t(
                  'usersAndGroups.groups.forms.group.tooltip.restrictionsEmpty'
                )}
              >
                <FiInfo aria-hidden />
              </span>
            )}
          </label>
          <Controller
            name="restrictions"
            control={control}
            render={({ field }) => (
              <Dropdown
                multiple
                display="chip"
                disabled={!canManage || restrictions.length === 0}
                placeholder={
                  restrictions.length === 0
                    ? t('global.noData')
                    : t(
                        isSyncEnabled
                          ? 'usersAndGroups.groups.forms.group.placeholder.sites'
                          : 'usersAndGroups.groups.forms.group.placeholder.restrictions'
                      )
                }
                options={restrictionOptions}
                optionLabel="label"
                optionValue="value"
                value={field.value ?? []}
                onChange={(e) => field.onChange(e.value ?? [])}
              />
            )}
          />
        </div>
      </FormGridRow>
      {groupType === GroupUserTypes.EMPLOYEE && (
        <FormGridRow>
          <div className={`${inputFieldStyles.field} ${styles.rolesField}`}>
            <label className={inputFieldStyles.label}>
              {t('usersAndGroups.groups.forms.group.role.title')}
            </label>
            <SectionBox>
              <GroupDetailsGeneralFormRoles />
            </SectionBox>
          </div>
        </FormGridRow>
      )}
    </FormGrid>
  )
}

export default GroupDetailsGeneralForm
