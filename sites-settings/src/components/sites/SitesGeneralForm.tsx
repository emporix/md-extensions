import { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  Dropdown,
  FieldLabel,
  InputText,
  useToast,
} from '@emporix/component-library'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useCurrencies } from '../../hooks/useCurrencies'
import { useCountries } from '../../hooks/useCountries'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { usePaymentGatewayApi } from '../../hooks/api/paymentGateway'
import { getApiErrorDetails } from '../../helpers/api'
import {
  isValidCartCalculationScale,
  keepDefaultLanguage,
  parseCartCalculationScale,
  SiteFormFields,
  toSitePayments,
} from '../../helpers/sites.helpers'
import { PaymentMethod, TaxDeterminationBasedOn } from '../../models/Site.model'
import { useCanManageSites } from './useCanManageSites'
import styles from './SiteForm.module.scss'

const SitesGeneralForm = () => {
  const { t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const { control, setValue, getValues } = useFormContext<SiteFormFields>()
  const { currenciesDropdownOptions } = useCurrencies()
  const { languages } = useConfiguration()
  const { activeCountryOptions } = useCountries()
  const { showError } = useToast()
  const { getPaymentMethods } = usePaymentGatewayApi()
  const canManage = useCanManageSites()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const selectedLanguages = useWatch({ control, name: 'languages' })

  useEffect(() => {
    let cancelled = false
    getPaymentMethods()
      .then((modes) => {
        if (cancelled) return
        // MD maps a payment mode to the site's payment entry.
        setPaymentMethods(
          modes.map((mode) => ({
            id: mode.id,
            active: mode.active,
            name: mode.code,
            serviceType: mode.provider,
            serviceUrl: '',
          }))
        )
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          showError(t('sites.toasts.errorFetchMethods'), getApiErrorDetails(e))
        }
      })
    return () => {
      cancelled = true
    }
    // The toast helpers are not stable; the load depends on the tenant only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPaymentMethods])

  useEffect(() => {
    // A default language that is no longer a site language is cleared (MD).
    const defaultLanguage = getValues('defaultLanguage')
    const kept = keepDefaultLanguage(selectedLanguages ?? [], defaultLanguage)
    if (kept !== defaultLanguage) {
      setValue('defaultLanguage', kept, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [selectedLanguages, getValues, setValue])

  const languageOptions = useMemo(
    () => languages.map((l) => ({ label: l.label, value: l.id })),
    [languages]
  )

  const defaultLanguageOptions = useMemo(
    () =>
      languageOptions.filter((option) =>
        (selectedLanguages ?? []).includes(option.value)
      ),
    [languageOptions, selectedLanguages]
  )

  // MD: fixed EN/DE names shown in the content language.
  const taxDeterminationOptions = useMemo(
    () => [
      {
        value: TaxDeterminationBasedOn.BILLING,
        label: getContentLangValue({
          en: 'Billing Address',
          de: 'Rechnungsadresse',
        }),
      },
      {
        value: TaxDeterminationBasedOn.SHIPPING,
        label: getContentLangValue({
          en: 'Shipping Address',
          de: 'Lieferadresse',
        }),
      },
    ],
    [getContentLangValue]
  )

  const availableCurrencyOptions = useMemo(
    () =>
      currenciesDropdownOptions.map((option) => ({
        label: option.value,
        value: option.value,
        displayLabel: option.label,
      })),
    [currenciesDropdownOptions]
  )

  const paymentOptions = useMemo(
    () =>
      paymentMethods.map((method) => ({
        label: method.name ?? method.id ?? '',
        value: method.id ?? '',
      })),
    [paymentMethods]
  )

  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <div className={`${styles.span2} ${styles.checkboxField}`}>
          <FieldLabel htmlFor="site-active">
            {t('sites.form.active')}
          </FieldLabel>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Checkbox
                inputId="site-active"
                data-testid="active"
                checked={field.value}
                disabled={!canManage}
                onChange={(e) => field.onChange(Boolean(e.checked))}
              />
            )}
          />
        </div>
        <div className={`${styles.span2} ${styles.checkboxField}`}>
          <FieldLabel htmlFor="site-default">
            {t('sites.form.default')}
          </FieldLabel>
          <Controller
            name="default"
            control={control}
            render={({ field }) => (
              <Checkbox
                inputId="site-default"
                data-testid="default"
                checked={field.value}
                disabled={!canManage}
                onChange={(e) => field.onChange(Boolean(e.checked))}
              />
            )}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.span8}>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                label={t('sites.form.name')}
                required
                data-testid="name-input"
                readOnly={!canManage}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                label={t('sites.form.code')}
                required
                data-testid="code-input"
                readOnly={!canManage}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.span4}>
          <Controller
            name="languages"
            control={control}
            rules={{ validate: (value) => value.length > 0 }}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.languages')}
                required
                multiple
                data-testid="languages"
                disabled={!canManage}
                options={languageOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? [])}
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="defaultLanguage"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.defaultLanguage')}
                required
                data-testid="default-language"
                disabled={!selectedLanguages?.length || !canManage}
                options={defaultLanguageOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? '')}
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="shipToCountries"
            control={control}
            rules={{ validate: (value) => value.length > 0 }}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.shipToCountries')}
                required
                multiple
                filter
                data-testid="ship-to-countries"
                disabled={!canManage}
                options={activeCountryOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? [])}
              />
            )}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.span4}>
          <Controller
            name="currency"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.currency')}
                required
                data-testid="currency"
                disabled={!canManage}
                options={currenciesDropdownOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? '')}
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="cartCalculationScale"
            control={control}
            rules={{ validate: isValidCartCalculationScale }}
            render={({ field }) => (
              <InputText
                label={t('sites.form.cartCalculationScale')}
                tooltip={t('sites.form.cartCalculationScaleTooltip')}
                type="number"
                min={0}
                data-testid="cart-calculation-scale"
                readOnly={!canManage}
                value={String(field.value ?? 2)}
                onChange={(e) =>
                  field.onChange(parseCartCalculationScale(e.target.value))
                }
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="payment"
            control={control}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.paymentMethods')}
                multiple
                data-testid="payment-methods"
                disabled={!canManage}
                options={paymentOptions}
                value={(field.value ?? []).map((p) => p.id)}
                onChange={(e) =>
                  field.onChange(
                    toSitePayments(
                      (e.value as string[] | null) ?? [],
                      field.value ?? [],
                      paymentMethods
                    )
                  )
                }
              />
            )}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.span4}>
          <Controller
            name="taxDeterminationBasedOn"
            control={control}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.taxDeterminationBasedOn')}
                required
                data-testid="tax-determination-based-on"
                disabled={!canManage}
                options={taxDeterminationOptions}
                value={field.value || TaxDeterminationBasedOn.BILLING}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />
        </div>
        <div className={styles.span4}>
          <Controller
            name="availableCurrencies"
            control={control}
            render={({ field }) => (
              <Dropdown
                label={t('sites.form.availableCurrencies')}
                multiple
                filter
                data-testid="available-currencies"
                disabled={!canManage}
                // MD: the list shows "EUR - Euro", the selection the codes.
                itemTemplate={(option: { displayLabel: string }) =>
                  option.displayLabel
                }
                options={availableCurrencyOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.value ?? [])}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default SitesGeneralForm
