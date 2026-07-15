import { useEffect, useMemo, useRef } from 'react'
import { Dropdown } from '@emporix/component-library'
import { Controller, useFormContext } from 'react-hook-form'
import {
  GroupFormFields,
  ServiceType,
} from '../../helpers/groups/groupForm.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useGroupRole } from '../../context/GroupRole.provider'
import {
  AccessControlsTemplate,
  DCP_TEMPLATES,
  OE_TEMPLATES,
} from '../../configs/accessControlsTemplates'

const GroupDetailsGeneralFormRolesTemplates = () => {
  const { control, setValue } = useFormContext<GroupFormFields>()
  const { getUiLangValue } = useLocalizedValue()
  const { activeServiceType } = useGroupRole()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    setValue('dcpTemplates', [])
    setValue('oeTemplates', [])
  }, [activeServiceType, setValue])

  const onTemplatesChange = (
    selected: AccessControlsTemplate[],
    fieldOnChange: (value: AccessControlsTemplate[]) => void
  ) => {
    fieldOnChange(selected)
    const mergedAcs = [...new Set(selected.flatMap((s) => s.accessControls))]
    setValue('accessControls', mergedAcs, { shouldDirty: true })
  }

  const availableTemplates =
    activeServiceType === ServiceType.DCP ? DCP_TEMPLATES : OE_TEMPLATES

  const templateOptions = useMemo(
    () =>
      availableTemplates
        .map((template) => ({
          label: getUiLangValue(template.name),
          value: template.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [availableTemplates, getUiLangValue]
  )

  return (
    <Controller
      name={
        activeServiceType === ServiceType.DCP ? 'dcpTemplates' : 'oeTemplates'
      }
      control={control}
      render={({ field }) => {
        const selectedTemplateIds = (field.value ?? []).map(
          (template) => template.id
        )

        return (
          <Dropdown
            multiple
            display="chip"
            disabled={!canManage}
            options={templateOptions}
            optionLabel="label"
            optionValue="value"
            value={selectedTemplateIds}
            onChange={(e) => {
              const selectedIds = (e.value as string[]) ?? []
              const selected = availableTemplates.filter((template) =>
                selectedIds.includes(template.id)
              )
              onTemplatesChange(selected, field.onChange)
            }}
          />
        )
      }}
    />
  )
}

export default GroupDetailsGeneralFormRolesTemplates
