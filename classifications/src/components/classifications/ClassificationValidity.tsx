import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import {
  Calendar,
  Checkbox,
  Dropdown,
  SectionBox,
} from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import columns from '../shared/FormColumns.module.scss'

enum ValidityType {
  ALWAYS = 'always',
  CUSTOM = 'custom',
}

const toDate = (value: string) => (value ? new Date(value) : undefined)

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : ''

/** Ported from management-dashboard `modules/classifications/components/ClassificationValidity`. */
const ClassificationValidity = () => {
  const { t, i18n } = useTranslation()
  const { control, watch, setValue } =
    useFormContext<ClassificationFormFields>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  const [validityType, setValidityType] = useState<ValidityType>()
  const validityFrom = watch('validityFrom')
  const validityTo = watch('validityTo')
  const areDatesDisabled = !canManage || validityType !== ValidityType.CUSTOM

  useEffect(() => {
    setValidityType(
      validityFrom || validityTo ? ValidityType.CUSTOM : ValidityType.ALWAYS
    )
  }, [validityFrom, validityTo])

  const validityTypes = useMemo(
    () => [
      {
        label: t('classifications.labels.custom'),
        value: ValidityType.CUSTOM,
      },
      {
        label: t('classifications.labels.always'),
        value: ValidityType.ALWAYS,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  )

  const changeValidityType = (type: ValidityType) => {
    setValidityType(type)
    // Always valid has no dates; the disabled pickers would keep them otherwise.
    if (type === ValidityType.ALWAYS) {
      setValue('validityFrom', '', { shouldDirty: true })
      setValue('validityTo', '', { shouldDirty: true })
    }
  }

  return (
    <SectionBox name={t('classifications.titles.validity')}>
      <FormGridRow>
        <InputField
          label={t('classifications.forms.validity.fields.published')}
          className={columns.col12}
          name="published"
        >
          <Controller
            name="published"
            control={control}
            render={({ field }) => (
              <Checkbox
                inputId="published"
                disabled={!canManage}
                checked={field.value}
                onChange={(event) => field.onChange(!!event.checked)}
                data-testid="classification-published"
              />
            )}
          />
        </InputField>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col4}>
          <Dropdown
            inputId="validityType"
            label={t('classifications.forms.validity.fields.type')}
            disabled={!canManage}
            options={validityTypes}
            value={validityType}
            onChange={(event) =>
              changeValidityType(event.value as ValidityType)
            }
            data-testid="classification-validity-type"
          />
        </div>
        <div className={columns.col4}>
          <Controller
            name="validityFrom"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="validityFrom"
                label={t('classifications.forms.validity.fields.validFrom')}
                hideOnDateTimeSelect
                className={columns.fullWidth}
                disabled={areDatesDisabled}
                value={toDate(field.value)}
                onChange={(event) => field.onChange(toIsoString(event.value))}
                data-testid="classification-valid-from"
              />
            )}
          />
        </div>
        <div className={columns.col4}>
          <Controller
            name="validityTo"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="validityTo"
                label={t('classifications.forms.validity.fields.validTo')}
                hideOnDateTimeSelect
                className={columns.fullWidth}
                disabled={areDatesDisabled}
                value={toDate(field.value)}
                onChange={(event) => field.onChange(toIsoString(event.value))}
                data-testid="classification-valid-to"
              />
            )}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default ClassificationValidity
