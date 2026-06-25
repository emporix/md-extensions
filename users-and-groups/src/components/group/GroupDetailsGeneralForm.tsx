import { useEffect, useMemo, useState } from 'react'
import FormGridRow from '../../components/shared/FormGridRow'
import InputField from '../../components/shared/InputField'
import { Controller, useFormContext } from 'react-hook-form'
import FormGrid from '../../components/shared/FormGrid'
import { useTranslation } from 'react-i18next'
import { GroupFormFields } from '../../helpers/groups/groupForm.helpers'
import LocalizedInput from '../../components/shared/LocalizedInput'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import GroupDetailsGeneralFormRoles from './GroupDetailsGeneralFormRoles'
import { Dropdown, InputText } from '@emporix/component-library'
import { GroupUserTypes } from '../../models/Groups.model'
import { useGroupData } from '../../context/Group.provider'
import { useConfigurationApi } from '../../hooks/api/configuration'
import SectionBox from '../../components/shared/SectionBox'

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
              className="col-12"
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
        <InputField
          className="col-6"
          label={t('usersAndGroups.groups.forms.group.name')}
          required
        >
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
            render={({ field }) => (
              <LocalizedInput
                value={field.value}
                displayOnly={!canManage}
                onChange={field.onChange}
              />
            )}
          />
        </InputField>
        <InputField
          className="col-6"
          label={t('usersAndGroups.groups.forms.group.description')}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                value={field.value}
                displayOnly={!canManage}
                onChange={field.onChange}
              />
            )}
          />
        </InputField>
      </FormGridRow>
      <FormGridRow>
        <InputField
          className="col-6"
          label={t(
            isSyncEnabled
              ? 'usersAndGroups.groups.forms.group.sites'
              : 'usersAndGroups.groups.forms.group.restrictions'
          )}
          tooltip={
            restrictions.length === 0
              ? t('usersAndGroups.groups.forms.group.tooltip.restrictionsEmpty')
              : undefined
          }
        >
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
        </InputField>
      </FormGridRow>
      {groupType === GroupUserTypes.EMPLOYEE && (
        <FormGridRow>
          <InputField
            className="col-12"
            label={t('usersAndGroups.groups.forms.group.role.title')}
          >
            <SectionBox>
              <GroupDetailsGeneralFormRoles />
            </SectionBox>
          </InputField>
        </FormGridRow>
      )}
    </FormGrid>
  )
}

export default GroupDetailsGeneralForm
