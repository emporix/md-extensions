import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { InputNumber } from '@emporix/component-library'
import { SiteFormFields } from '../../helpers/sites.helpers'
import { useCanManageSites } from './useCanManageSites'
import styles from './SiteForm.module.scss'

const SitesCoordinatesForm = () => {
  const { t, i18n } = useTranslation()
  const { control } = useFormContext<SiteFormFields>()
  const canManage = useCanManageSites()

  const coordinate = (name: 'longitude' | 'latitude') => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InputNumber
          label={t(`sites.form.${name}`)}
          data-testid={`${name}-input`}
          readOnly={!canManage}
          locale={i18n.language}
          maxFractionDigits={20}
          value={field.value ?? null}
          onChange={(e) => field.onChange(e.value ?? undefined)}
        />
      )}
    />
  )

  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <div className={styles.span4}>{coordinate('longitude')}</div>
        <div className={styles.span4}>{coordinate('latitude')}</div>
      </div>
    </div>
  )
}

export default SitesCoordinatesForm
