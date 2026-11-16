import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { InputText, SectionBox } from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import LocalizedInput from '../shared/LocalizedInput'
import { usePermissions } from '../../context/PermissionsProvider'
import { useClassificationData } from '../../context/Classification.provider'
import { isEmptyObject } from '../../helpers/utils'
import { EmployeeDomains } from '../../configs/accessControls'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import columns from '../shared/FormColumns.module.scss'

/** Ported from management-dashboard `modules/classifications/components/ClassificationDetails`. */
const ClassificationDetails = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<ClassificationFormFields>()
  const { classification } = useClassificationData()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  return (
    <SectionBox name={t('classifications.titles.general')}>
      <FormGridRow>
        <div className={columns.col6}>
          <Controller
            name="name"
            control={control}
            rules={{
              validate: (value) => !!value && !isEmptyObject(value),
            }}
            render={({ field }) => (
              <LocalizedInput
                label={t('classifications.forms.general.fields.name')}
                required
                displayOnly={!canManage}
                value={field.value}
                onChange={(value) => field.onChange(value ?? {})}
                data-testid="classification-name"
              />
            )}
          />
        </div>
        <div className={columns.col6}>
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                inputId="code"
                label={t('classifications.forms.general.fields.code')}
                required
                readOnly={!canManage || !!classification}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                data-testid="classification-code"
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={columns.col12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                label={t('classifications.forms.general.fields.description')}
                textarea
                displayOnly={!canManage}
                value={field.value}
                onChange={(value) => field.onChange(value ?? {})}
                data-testid="classification-description"
              />
            )}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default ClassificationDetails
