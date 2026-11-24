import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Dropdown, InputText } from '@emporix/component-library'
import { useCountries } from '../../hooks/useCountries'
import { getSiteTimezoneOptions } from '../../helpers/timezone.helpers'
import { SiteFormFields } from '../../helpers/sites.helpers'
import { useCanManageSites } from './useCanManageSites'
import styles from './SiteForm.module.scss'

type TextField = 'city' | 'state' | 'street' | 'streetNumber' | 'zipCode'

const SitesAddressForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<SiteFormFields>()
  const { countryOptions } = useCountries()
  const canManage = useCanManageSites()

  const textField = (name: TextField) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InputText
          label={t(`sites.form.${name}`)}
          data-testid={`${name}-input`}
          readOnly={!canManage}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        />
      )}
    />
  )

  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <div className={styles.span4}>{textField('city')}</div>
        <div className={styles.span4}>
          <Controller
            name="country"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.country')}
                required
                filter
                data-testid="country"
                disabled={!canManage}
                options={countryOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? '')}
              />
            )}
          />
        </div>
        <div className={styles.span4}>{textField('state')}</div>
      </div>

      <div className={styles.row}>
        <div className={styles.span4}>{textField('street')}</div>
        <div className={styles.span4}>{textField('streetNumber')}</div>
        <div className={styles.span4}>{textField('zipCode')}</div>
      </div>

      <div className={styles.row}>
        <div className={styles.span4}>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.timezone')}
                inputId={field.name}
                filter
                data-testid="timezone"
                disabled={!canManage}
                options={getSiteTimezoneOptions(field.value)}
                optionLabel="label"
                optionValue="value"
                placeholder={t('sites.form.selectTimezone')}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? '')}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default SitesAddressForm
