import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { InputText } from '@emporix/component-library'
import { SiteFormFields } from '../../helpers/sites.helpers'
import { useCanManageSites } from './useCanManageSites'
import styles from './SiteForm.module.scss'

const SitesAssistedBuyingForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<SiteFormFields>()
  const canManage = useCanManageSites()

  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <div className={styles.span12}>
          <Controller
            name="storefrontUrl"
            control={control}
            render={({ field }) => (
              <InputText
                label={t('sites.form.storefrontUrl')}
                data-testid="storefront-url-input"
                readOnly={!canManage}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default SitesAssistedBuyingForm
