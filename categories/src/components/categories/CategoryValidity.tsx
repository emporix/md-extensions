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
import { useCategoryData } from '../../context/Category.provider'
import { EmployeeDomains } from '../../configs/accessControls'
import {
  CategoryFormFields,
  CategoryValidityType,
  getCategoryValidityType,
} from '../../helpers/categoryForm.helpers'
import columns from '../shared/FormColumns.module.scss'

const toDate = (value: string) => (value ? new Date(value) : undefined)

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : ''

/** Ported from management-dashboard `modules/categories/components/CategoryValidity`. */
const CategoryValidity = () => {
  const { t, i18n } = useTranslation()
  const { control, setValue } = useFormContext<CategoryFormFields>()
  const { category } = useCategoryData()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const [validityType, setValidityType] = useState(CategoryValidityType.ALWAYS)
  const areDatesDisabled =
    !canManage || validityType !== CategoryValidityType.CUSTOM

  useEffect(() => {
    if (category) {
      setValidityType(getCategoryValidityType(category))
    }
  }, [category])

  const validityTypes = useMemo(
    () => [
      {
        label: t('categories.edit.tab.validity.custom'),
        value: CategoryValidityType.CUSTOM,
      },
      {
        label: t('categories.edit.tab.validity.always'),
        value: CategoryValidityType.ALWAYS,
      },
      {
        label: t('categories.edit.tab.validity.never'),
        value: CategoryValidityType.NEVER,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  )

  const changeValidityType = (type: CategoryValidityType) => {
    setValidityType(type)
    // Always valid has no dates; the disabled pickers would keep them otherwise.
    if (type === CategoryValidityType.ALWAYS) {
      setValue('validityFrom', '', { shouldDirty: true })
      setValue('validityTo', '', { shouldDirty: true })
    }
  }

  return (
    <SectionBox name={t('categories.edit.tab.validity.title')}>
      <FormGridRow>
        <div className={columns.col4}>
          <Dropdown
            inputId="validityType"
            label={t('categories.edit.tab.validity.type')}
            disabled={!canManage}
            options={validityTypes}
            value={validityType}
            onChange={(event) =>
              changeValidityType(event.value as CategoryValidityType)
            }
            data-testid="category-validity-type"
          />
        </div>
        <div className={columns.col4}>
          <Controller
            name="validityFrom"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="validityFrom"
                label={t('categories.edit.tab.validity.from')}
                showTime
                className={columns.fullWidth}
                disabled={areDatesDisabled}
                value={toDate(field.value)}
                onChange={(event) => field.onChange(toIsoString(event.value))}
                data-testid="category-valid-from"
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
                label={t('categories.edit.tab.validity.to')}
                showTime
                className={columns.fullWidth}
                disabled={areDatesDisabled}
                value={toDate(field.value)}
                onChange={(event) => field.onChange(toIsoString(event.value))}
                data-testid="category-valid-to"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <InputField
          label={t('categories.edit.tab.validity.published')}
          className={columns.col12}
          name="published"
          required
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
                data-testid="category-published"
              />
            )}
          />
        </InputField>
      </FormGridRow>
    </SectionBox>
  )
}

export default CategoryValidity
