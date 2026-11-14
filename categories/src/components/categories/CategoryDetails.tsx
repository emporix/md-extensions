import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { Chips, InputText, SectionBox } from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import LocalizedInput from '../shared/LocalizedInput'
import { usePermissions } from '../../context/PermissionsProvider'
import { useCategoryData } from '../../context/Category.provider'
import { hasLocalizedValue } from '../../helpers/localized'
import { EmployeeDomains } from '../../configs/accessControls'
import { CategoryFormFields } from '../../helpers/categoryForm.helpers'
import columns from '../shared/FormColumns.module.scss'

/** Ported from management-dashboard `modules/categories/components/CategoryDetails`. */
const CategoryDetails = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CategoryFormFields>()
  const { category } = useCategoryData()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  return (
    <SectionBox name={t('categories.edit.tab.details.title')}>
      <FormGridRow>
        <div className={columns.col6}>
          <Controller
            name="id"
            control={control}
            render={({ field }) => (
              <InputText
                inputId="id"
                label={t('categories.edit.tab.details.id')}
                tooltip={t('categories.edit.tab.tooltip.id')}
                readOnly={!canManage || !!category}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                data-testid="category-id"
              />
            )}
          />
        </div>
        <div className={columns.col6}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                inputId="code"
                label={t('categories.edit.tab.details.code')}
                readOnly={!canManage}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                data-testid="category-code"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col6}>
          <Controller
            name="localizedName"
            control={control}
            rules={{
              validate: (value) =>
                hasLocalizedValue(value) ||
                t('categories.edit.validation.required'),
            }}
            render={({ field, fieldState }) => (
              <LocalizedInput
                label={t('categories.edit.tab.details.name')}
                required
                displayOnly={!canManage}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                data-testid="category-name"
              />
            )}
          />
        </div>
        <div className={columns.col6}>
          <Controller
            name="localizedSlug"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                label={t('categories.edit.tab.details.slug')}
                displayOnly={!canManage}
                value={field.value}
                onChange={field.onChange}
                data-testid="category-slug"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col12}>
          <Controller
            name="localizedDescription"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                label={t('categories.edit.tab.details.description')}
                displayOnly={!canManage}
                value={field.value}
                onChange={field.onChange}
                data-testid="category-description"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col12}>
          <Controller
            name="ecn"
            control={control}
            render={({ field }) => (
              <Chips
                label={t('categories.edit.tab.details.ecn')}
                disabled={!canManage}
                tooltip={t('categories.edit.tab.details.comma')}
                className={columns.fullWidth}
                value={field.value}
                separator=","
                onChange={(event) => field.onChange(event.value ?? [])}
                data-testid="category-ecn"
              />
            )}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default CategoryDetails
