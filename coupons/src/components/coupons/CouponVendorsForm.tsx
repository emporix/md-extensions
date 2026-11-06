import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { Checkbox, FieldLabel } from '@emporix/component-library'
import VendorsSelector from '../shared/VendorsSelector'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import { CouponFormFields } from '../../helpers/couponForm.helpers'
import { getCouponFieldErrorText } from '../../helpers/couponErrors.helpers'
import styles from './Coupons.module.scss'

const CouponVendorsForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CouponFormFields>()
  const vendorRestricted = useWatch({ control, name: 'vendorRestricted' })
  const { canEditVendors } = useCouponPermissions()

  return (
    <div className={styles.full}>
      <Controller
        name="vendorRestricted"
        control={control}
        render={({ field, fieldState }) => (
          <>
            <label
              htmlFor="vendorRestricted"
              className={classNames(styles.vendorOption, {
                [styles.vendorOptionDisabled]: !canEditVendors,
              })}
            >
              <Checkbox
                disabled={!canEditVendors}
                inputId="vendorRestricted"
                checked={!!field.value}
                onChange={(event) => field.onChange(!!event.checked)}
              />
              <span>
                <span className={styles.vendorTitle}>
                  {t('coupons.edit.tab.rules.vendorRestricted')}
                </span>
                <span className={styles.vendorDescription}>
                  {t('coupons.edit.tab.rules.vendorRestrictedHint')}
                </span>
              </span>
            </label>
            {fieldState.error && (
              <small className={styles.error}>
                {getCouponFieldErrorText(fieldState.error, t)}
              </small>
            )}
          </>
        )}
      />
      {vendorRestricted && (
        <div className={styles.vendorBody}>
          <FieldLabel>{t('coupons.edit.tab.rules.vendors')}</FieldLabel>
          <Controller
            name="vendors"
            control={control}
            rules={{ deps: ['vendorRestricted'] }}
            render={({ field }) => (
              <VendorsSelector
                value={field.value}
                onChange={field.onChange}
                canManage={canEditVendors}
              />
            )}
          />
        </div>
      )}
    </div>
  )
}

export default CouponVendorsForm
