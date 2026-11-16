import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { InputNumber, SectionBox } from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import CategoriesSelector from '../shared/CategoriesSelector'
import { usePermissions } from '../../context/PermissionsProvider'
import { CategoryType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import columns from '../shared/FormColumns.module.scss'
import styles from './ClassificationPath.module.scss'

const firstId = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

/** Ported from management-dashboard `modules/classifications/components/ClassificationPath`. */
const ClassificationPath = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<ClassificationFormFields>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  return (
    <SectionBox name={t('classifications.titles.path')}>
      <FormGridRow>
        <InputField
          className={styles.parent}
          label={t('classifications.forms.path.fields.parent')}
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
                type={CategoryType.CLASSIFICATION}
                data-testid="classification-parent"
              />
            )}
          />
        </InputField>
        <div className={styles.position}>
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <InputNumber
                inputId="position"
                label={t('classifications.forms.path.fields.position')}
                className={columns.fullWidth}
                readOnly={!canManage}
                value={field.value}
                min={0}
                useGrouping={false}
                onChange={(event) => field.onChange(event.value)}
                data-testid="classification-position"
              />
            )}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default ClassificationPath
