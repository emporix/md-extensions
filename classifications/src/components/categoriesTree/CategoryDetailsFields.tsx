import { useTranslation } from 'react-i18next'
import { type Control, Controller, useFormState } from 'react-hook-form'
import { InputText } from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import LocalizedInput from '../shared/LocalizedInput'
import { hasLocalizedValue } from '../../helpers/localized'
import { CategoryDetailsForm } from './categoryDetails.helpers'
import columns from '../shared/FormColumns.module.scss'

type CategoryDetailsFieldsProps = {
  readonly control: Control<CategoryDetailsForm>
  readonly canManage: boolean
  /** Only a new classification can be given an id and a code. */
  readonly isNew?: boolean
}

/**
 * Ported from management-dashboard `CategoryDetailsFields` with its
 * classification rules: the code is required and set once, when the
 * classification is created, as on its full page.
 */
const CategoryDetailsFields = ({
  control,
  canManage,
  isNew = false,
}: CategoryDetailsFieldsProps) => {
  const { t } = useTranslation()
  const { errors } = useFormState({ control })
  const requiredMessage = t('categories.edit.validation.required')

  return (
    <>
      <FormGridRow>
        <div className={columns.col12Xl6}>
          <Controller
            name="id"
            control={control}
            render={({ field }) => (
              <InputText
                label={t('categories.edit.tab.details.id')}
                tooltip={
                  isNew ? t('categories.edit.tab.tooltip.id') : undefined
                }
                readOnly={!isNew || !canManage}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                data-testid="category-panel-id"
              />
            )}
          />
        </div>
        <div className={columns.col12Xl6}>
          <Controller
            name="code"
            control={control}
            rules={{
              validate: (value) =>
                !isNew || value.trim() !== '' || requiredMessage,
            }}
            render={({ field }) => (
              <InputText
                label={t('categories.edit.tab.details.code')}
                required={isNew}
                error={errors.code?.message}
                readOnly={!canManage || !isNew}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                data-testid="category-panel-code"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col12Xl6}>
          <Controller
            name="localizedName"
            control={control}
            rules={{
              validate: (value) => hasLocalizedValue(value) || requiredMessage,
            }}
            render={({ field, fieldState }) => (
              <LocalizedInput
                label={t('categories.edit.tab.details.name')}
                required
                displayOnly={!canManage}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                data-testid="category-panel-name"
              />
            )}
          />
        </div>
        <div className={columns.col12Xl6}>
          <Controller
            name="localizedSlug"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                label={t('categories.edit.tab.details.slug')}
                displayOnly={!canManage}
                value={field.value}
                onChange={field.onChange}
                data-testid="category-panel-slug"
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
                data-testid="category-panel-description"
              />
            )}
          />
        </div>
      </FormGridRow>
    </>
  )
}

export default CategoryDetailsFields
