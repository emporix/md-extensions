import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { InputText, SectionBox } from '@emporix/component-library'
import { useCouponData } from '../../context/Coupon.provider'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import { CouponFormFields } from '../../helpers/couponForm.helpers'
import {
  validateCouponCode,
  validateCouponName,
} from '../../helpers/couponValidation.helpers'
import { getCouponFieldErrorText } from '../../helpers/couponErrors.helpers'
import styles from './Coupons.module.scss'

const CouponGeneralForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CouponFormFields>()
  const { coupon } = useCouponData()
  const { canManage } = useCouponPermissions()
  const isCreate = !coupon

  return (
    <SectionBox sectionClassName={styles.formGrid}>
      <Controller
        name="name"
        control={control}
        rules={{ validate: validateCouponName }}
        render={({ field, fieldState }) => (
          <InputText
            inputId="coupon-name"
            className={styles.half}
            label={t('coupons.edit.tab.details.name')}
            required
            error={getCouponFieldErrorText(fieldState.error, t)}
            readOnly={!canManage}
            data-testid="name-input"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="code"
        control={control}
        rules={{ validate: (value) => validateCouponCode(value, isCreate) }}
        render={({ field, fieldState }) => (
          <InputText
            inputId="coupon-code"
            className={styles.half}
            label={t('coupons.edit.tab.details.code')}
            error={getCouponFieldErrorText(fieldState.error, t)}
            // The service keys coupons by code: it is set once, on create.
            readOnly={!canManage || !isCreate}
            data-testid="code-input"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <InputText
            textarea
            rows={10}
            inputId="coupon-description"
            className={styles.full}
            label={t('coupons.edit.tab.details.description')}
            error={getCouponFieldErrorText(fieldState.error, t)}
            readOnly={!canManage}
            data-testid="description-input"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
          />
        )}
      />
    </SectionBox>
  )
}

export default CouponGeneralForm
