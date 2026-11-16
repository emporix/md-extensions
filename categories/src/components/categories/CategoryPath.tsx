import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { InputNumber, SectionBox } from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import CategoriesSelector from '../shared/CategoriesSelector'
import { usePermissions } from '../../context/PermissionsProvider'
import { CategoryType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { CategoryFormFields } from '../../helpers/categoryForm.helpers'
import columns from '../shared/FormColumns.module.scss'

const firstId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/** Ported from management-dashboard `modules/categories/components/CategoryPath`. */
const CategoryPath = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CategoryFormFields>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  return (
    <SectionBox name={t('categories.edit.tab.path.title')}>
      <FormGridRow>
        <InputField
          className={columns.col6}
          label={t('categories.edit.tab.path.parent')}
          name="parentId"
        >
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <CategoriesSelector
                value={field.value}
                onChange={(value) => field.onChange(firstId(value))}
                singleSelection
                type={CategoryType.STANDARD}
                // A parent can be unpublished; without this it shows as its id.
                showUnpublished
                data-testid="category-parent"
              />
            )}
          />
        </InputField>
        <div className={columns.col6}>
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <InputNumber
                inputId="position"
                label={t('categories.edit.tab.details.position')}
                className={columns.fullWidth}
                readOnly={!canManage}
                value={field.value}
                min={0}
                useGrouping={false}
                onChange={(event) => field.onChange(event.value)}
                data-testid="category-position"
              />
            )}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default CategoryPath
