import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FieldLabel } from '@emporix/component-library'
import CategoriesSelector from '../shared/CategoriesSelector'
import CustomersSelector from '../shared/CustomersSelector'
import SegmentsSelector from '../shared/SegmentsSelector'
import useCouponPermissions, {
  CouponPermissions,
} from '../../hooks/useCouponPermissions'
import {
  CouponAppliesTo,
  CouponFormFields,
} from '../../helpers/couponForm.helpers'
import { isCategoriesAllowedForDiscountType } from '../../helpers/couponRestrictions.helpers'
import {
  validateAppliesTo,
  validateExcludedCategories,
} from '../../helpers/couponValidation.helpers'
import { getCouponFieldErrorText } from '../../helpers/couponErrors.helpers'
import CouponRestrictionOption from './CouponRestrictionOption'
import styles from './Coupons.module.scss'

const KEY = 'coupons.edit.tab.rules.appliesTo'

interface OptionConfig {
  value: CouponAppliesTo
  inputId: string
  titleKey: string
  descriptionKey: string
}

const OPTIONS: OptionConfig[] = [
  {
    value: 'ALL_CUSTOMERS',
    inputId: 'allCustomers',
    titleKey: `${KEY}.allCustomers`,
    descriptionKey: `${KEY}.allCustomersHint`,
  },
  {
    value: 'REGISTERED_CUSTOMERS',
    inputId: 'registeredCustomers',
    titleKey: `${KEY}.registeredCustomers`,
    descriptionKey: `${KEY}.registeredCustomersHint`,
  },
  {
    value: 'SPECIFIC_CUSTOMERS',
    inputId: 'specificCustomer',
    titleKey: `${KEY}.specificCustomer`,
    descriptionKey: `${KEY}.specificCustomerHint`,
  },
  {
    value: 'SEGMENTS',
    inputId: 'segmentRestricted',
    titleKey: `${KEY}.customerSegments`,
    descriptionKey: `${KEY}.customerSegmentsHint`,
  },
  {
    value: 'CATEGORIES',
    inputId: 'categoryRestricted',
    titleKey: `${KEY}.categories`,
    descriptionKey: `${KEY}.categoriesHint`,
  },
]

const hasBody = (option: CouponAppliesTo) =>
  option === 'SPECIFIC_CUSTOMERS' ||
  option === 'SEGMENTS' ||
  option === 'CATEGORIES'

// eslint-disable-next-line react-refresh/only-export-components
export const isOptionDisabled = (
  option: CouponAppliesTo,
  permissions: CouponPermissions,
  categoriesAllowed: boolean
): boolean => {
  switch (option) {
    case 'SPECIFIC_CUSTOMERS':
      return !permissions.canEditCustomers
    case 'SEGMENTS':
      return !permissions.canEditSegments
    case 'CATEGORIES':
      return !permissions.canEditCategories || !categoriesAllowed
    default:
      return !permissions.canManage
  }
}

const FieldError = ({ text }: { readonly text: string | undefined }) =>
  text ? <small className={styles.error}>{text}</small> : null

const CouponAppliesToForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<CouponFormFields>()
  const discountType = useWatch({ control, name: 'discountType' })
  const permissions = useCouponPermissions()
  const categoriesAllowed = isCategoriesAllowedForDiscountType(discountType)

  const renderOptionBody = (
    option: CouponAppliesTo,
    error: string | undefined
  ): ReactNode => {
    switch (option) {
      case 'SPECIFIC_CUSTOMERS':
        return (
          <div className={styles.full}>
            <FieldLabel>{t('coupons.edit.tab.rules.validFor')}</FieldLabel>
            <Controller
              name="validFor"
              control={control}
              rules={{ deps: ['appliesTo'] }}
              render={({ field }) => (
                <CustomersSelector
                  value={field.value}
                  onChange={field.onChange}
                  canManage={permissions.canEditCustomers}
                />
              )}
            />
            <FieldError text={error} />
          </div>
        )
      case 'SEGMENTS':
        return (
          <div className={styles.full}>
            <FieldLabel>{t('coupons.edit.tab.rules.segments')}</FieldLabel>
            <Controller
              name="segments"
              control={control}
              rules={{ deps: ['appliesTo'] }}
              render={({ field }) => (
                <SegmentsSelector
                  value={field.value}
                  onChange={field.onChange}
                  canManage={permissions.canEditSegments}
                />
              )}
            />
            <FieldError text={error} />
          </div>
        )
      case 'CATEGORIES':
        return (
          <>
            <div className={`${styles.full} ${styles.fieldGap}`}>
              <FieldLabel>
                {t('coupons.edit.tab.categories.includedCategories')}
              </FieldLabel>
              <Controller
                name="includedCategories"
                control={control}
                rules={{ deps: ['appliesTo', 'excludedCategories'] }}
                render={({ field }) => (
                  <CategoriesSelector
                    value={field.value}
                    onChange={field.onChange}
                    canManage={permissions.canEditCategories}
                    showUnpublished
                  />
                )}
              />
              <FieldError text={error} />
            </div>
            <Controller
              name="excludedCategories"
              control={control}
              rules={{
                deps: ['appliesTo'],
                validate: (value, form) =>
                  validateExcludedCategories(value, form),
              }}
              render={({ field, fieldState }) => (
                <div className={styles.full}>
                  <FieldLabel>
                    {t('coupons.edit.tab.categories.excludedCategories')}
                  </FieldLabel>
                  <CategoriesSelector
                    value={field.value}
                    onChange={field.onChange}
                    canManage={permissions.canEditCategories}
                    showUnpublished
                  />
                  <FieldError
                    text={getCouponFieldErrorText(fieldState.error, t)}
                  />
                </div>
              )}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <Controller
      name="appliesTo"
      control={control}
      rules={{ validate: (value, form) => validateAppliesTo(value, form) }}
      render={({ field, fieldState }) => {
        const errorText = getCouponFieldErrorText(fieldState.error, t)
        const selectedHasBody = hasBody(field.value)
        return (
          <div className={styles.appliesTo}>
            <div className={styles.appliesToTitle} id="coupon-applies-to">
              {t(`${KEY}.title`)}
            </div>
            <div className={styles.appliesToHint}>{t(`${KEY}.hint`)}</div>
            <div
              className={styles.restrictionOptions}
              role="radiogroup"
              aria-labelledby="coupon-applies-to"
            >
              {OPTIONS.map((option) => (
                <CouponRestrictionOption
                  key={option.value}
                  inputId={option.inputId}
                  name="appliesTo"
                  title={t(option.titleKey)}
                  description={t(option.descriptionKey)}
                  checked={field.value === option.value}
                  disabled={isOptionDisabled(
                    option.value,
                    permissions,
                    categoriesAllowed
                  )}
                  onSelect={() => field.onChange(option.value)}
                >
                  {hasBody(option.value)
                    ? renderOptionBody(option.value, errorText)
                    : undefined}
                </CouponRestrictionOption>
              ))}
            </div>
            {errorText && !selectedHasBody && (
              <small className={styles.error}>{errorText}</small>
            )}
          </div>
        )
      }}
    />
  )
}

export default CouponAppliesToForm
