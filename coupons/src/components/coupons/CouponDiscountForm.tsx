import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import {
  Dropdown,
  FieldLabel,
  InputNumber,
  SectionBox,
} from '@emporix/component-library'
import PriceInput from '../shared/PriceInput'
import { useCurrencyContext } from '../../context/Currency.provider'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import {
  CouponFormFields,
  DEFAULT_DISCOUNT_CALCULATION_TYPE,
} from '../../helpers/couponForm.helpers'
import {
  validateDiscountAmount,
  validateDiscountPercentage,
} from '../../helpers/couponValidation.helpers'
import { getCouponFieldErrorText } from '../../helpers/couponErrors.helpers'
import styles from './Coupons.module.scss'

const CouponDiscountForm = () => {
  const { t, i18n } = useTranslation()
  const { control } = useFormContext<CouponFormFields>()
  const discountType = useWatch({ control, name: 'discountType' })
  const discountCurrency = useWatch({
    control,
    name: 'discountAbsolute.currency',
  })
  const { selectedCurrency, currenciesDropdownOptions } = useCurrencyContext()
  const { canManage } = useCouponPermissions()

  const discountTypes = useMemo(
    () => [
      { value: 'PERCENT', label: t('coupons.type.percent') },
      { value: 'FREE_SHIPPING', label: t('coupons.type.freeShipping') },
      { value: 'ABSOLUTE', label: t('coupons.type.absolute') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild per language
    [i18n.language]
  )
  const calculationBases = useMemo(
    () => [
      {
        value: DEFAULT_DISCOUNT_CALCULATION_TYPE,
        label: t('coupons.calculationType.subtotal'),
      },
      { value: 'TOTAL', label: t('coupons.calculationType.total') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild per language
    [i18n.language]
  )

  const calculationBaseField = (testId: string) => (
    <Controller
      name="discountCalculationType"
      control={control}
      render={({ field }) => (
        <Dropdown
          inputId={testId}
          label={t('coupons.edit.tab.type.calculationBase')}
          disabled={!canManage}
          value={field.value}
          options={calculationBases}
          data-testid={testId}
          onChange={(event) => field.onChange(event.value)}
        />
      )}
    />
  )

  return (
    <SectionBox sectionClassName={styles.formGrid}>
      <Controller
        name="discountType"
        control={control}
        rules={{ deps: ['appliesTo'] }}
        render={({ field }) => (
          <Dropdown
            inputId="discountType"
            className={styles.half}
            label={t('coupons.edit.tab.type.discountType')}
            disabled={!canManage}
            value={field.value}
            data-testid="coupon-type"
            options={discountTypes}
            onChange={(event) => field.onChange(event.value)}
          />
        )}
      />

      <div className={styles.half}>
        {discountType === 'PERCENT' && (
          <div className={styles.innerGrid}>
            <Controller
              name="discountPercentage"
              control={control}
              rules={{
                validate: (value, form) =>
                  validateDiscountPercentage(value, form),
              }}
              render={({ field, fieldState }) => (
                <div className={styles.half}>
                  <FieldLabel htmlFor="coupon-discount-percentage">
                    {t('coupons.edit.tab.type.percentage')}
                  </FieldLabel>
                  <div className={styles.inputGroup}>
                    <InputNumber
                      inputId="coupon-discount-percentage"
                      readOnly={!canManage}
                      className={styles.inputGroupInput}
                      data-testid="percentage-discount-input"
                      mode="decimal"
                      locale={i18n.language}
                      minFractionDigits={0}
                      maxFractionDigits={2}
                      min={0}
                      value={field.value ?? null}
                      onChange={(event) => field.onChange(event.value)}
                      onBlur={field.onBlur}
                    />
                    <span className={styles.inputGroupAddon}>%</span>
                  </div>
                  {fieldState.error && (
                    <small className={styles.error}>
                      {getCouponFieldErrorText(fieldState.error, t)}
                    </small>
                  )}
                </div>
              )}
            />
            <div className={styles.half}>
              {calculationBaseField('calculation-basen')}
            </div>
          </div>
        )}
        {discountType === 'ABSOLUTE' && (
          <div className={styles.innerGrid}>
            <Controller
              name="discountAbsolute.amount"
              control={control}
              rules={{
                validate: (value, form) => validateDiscountAmount(value, form),
              }}
              render={({ field, fieldState }) => (
                <div className={styles.half}>
                  <FieldLabel>{t('coupons.edit.tab.type.absolute')}</FieldLabel>
                  <PriceInput
                    disabled={!canManage}
                    locale={i18n.language}
                    dataTestId="amount-discount-input"
                    currency={discountCurrency ?? selectedCurrency?.code}
                    onChange={(event) => field.onChange(event.value)}
                    value={field.value ?? undefined}
                  />
                  <small
                    className={styles.error}
                    data-testid="amount-discount-error"
                  >
                    {getCouponFieldErrorText(fieldState.error, t)}
                  </small>
                </div>
              )}
            />
            <Controller
              name="discountAbsolute.currency"
              control={control}
              render={({ field }) => (
                <Dropdown
                  inputId="currency"
                  className={styles.half}
                  label={t('coupons.edit.tab.type.currency')}
                  disabled={!canManage}
                  value={field.value ?? selectedCurrency?.code}
                  data-testid="currency"
                  options={currenciesDropdownOptions}
                  onChange={(event) => field.onChange(event.value)}
                />
              )}
            />
            <div className={styles.half}>
              {calculationBaseField('calculation-base')}
            </div>
          </div>
        )}
      </div>
    </SectionBox>
  )
}

export default CouponDiscountForm
