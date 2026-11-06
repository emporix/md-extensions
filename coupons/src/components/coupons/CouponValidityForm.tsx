import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import {
  Calendar,
  Divider,
  Dropdown,
  FieldLabel,
} from '@emporix/component-library'
import PriceInput from '../shared/PriceInput'
import { useCurrencyContext } from '../../context/Currency.provider'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import { CouponFormFields } from '../../helpers/couponForm.helpers'
import {
  validateMinOrderAmount,
  validateValidUntil,
} from '../../helpers/couponValidation.helpers'
import { getCouponFieldErrorText } from '../../helpers/couponErrors.helpers'
import styles from './Coupons.module.scss'

const toDate = (value: unknown): Date | null =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? value : null

const CouponValidityForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CouponFormFields>()
  const [validFrom, validUntil] = useWatch({
    control,
    name: ['validFrom', 'validUntil'],
  })
  const { selectedCurrency, currenciesDropdownOptions } = useCurrencyContext()
  const { canManage } = useCouponPermissions()

  return (
    <>
      <div className={styles.innerGrid}>
        <Controller
          name="validFrom"
          control={control}
          rules={{ deps: ['validUntil'] }}
          render={({ field, fieldState }) => (
            <Calendar
              inputId="coupon-valid-from"
              className={styles.half}
              label={t('coupons.edit.tab.rules.validFrom')}
              error={getCouponFieldErrorText(fieldState.error, t)}
              disabled={!canManage}
              showTime
              showButtonBar
              maxDate={validUntil ?? undefined}
              value={field.value ?? null}
              onChange={(event) => field.onChange(toDate(event.value))}
            />
          )}
        />
        <Controller
          name="validUntil"
          control={control}
          rules={{
            validate: (value, form) => validateValidUntil(value, form),
          }}
          render={({ field, fieldState }) => (
            <Calendar
              inputId="coupon-valid-until"
              className={styles.half}
              label={t('coupons.edit.tab.rules.validUntil')}
              error={getCouponFieldErrorText(fieldState.error, t)}
              disabled={!canManage}
              showTime
              showButtonBar
              minDate={validFrom ?? undefined}
              value={field.value ?? null}
              onChange={(event) => field.onChange(toDate(event.value))}
            />
          )}
        />
      </div>
      <Divider />
      <div className={styles.innerGrid}>
        <Controller
          name="minOrderValue.amount"
          control={control}
          rules={{ validate: validateMinOrderAmount }}
          render={({ field, fieldState }) => (
            <div className={styles.half}>
              <FieldLabel>
                {t('coupons.edit.tab.rules.minimumOrderTotal')}
              </FieldLabel>
              <PriceInput
                disabled={!canManage}
                onChange={(event) => field.onChange(event.value)}
                value={field.value ?? 0}
              />
              {fieldState.error && (
                <small className={styles.error}>
                  {getCouponFieldErrorText(fieldState.error, t)}
                </small>
              )}
            </div>
          )}
        />
        <Controller
          name="minOrderValue.currency"
          control={control}
          render={({ field }) => (
            <Dropdown
              inputId="minOrderValue-currency"
              className={styles.half}
              label={t('coupons.edit.tab.rules.currency')}
              disabled={!canManage}
              value={field.value ?? selectedCurrency?.code}
              options={currenciesDropdownOptions}
              onChange={(event) => field.onChange(event.value)}
            />
          )}
        />
      </div>
    </>
  )
}

export default CouponValidityForm
