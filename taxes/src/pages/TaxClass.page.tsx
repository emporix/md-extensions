import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import {
  Dropdown,
  InputNumber,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import FormGrid from '../components/shared/FormGrid'
import LocalizedInput from '../components/shared/LocalizedInput'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
  makeCall,
} from '../helpers/api'
import { useDashboardContext } from '../context/Dashboard.context'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { DuplicateTaxClassError, useTaxesApi } from '../hooks/api/taxes'
import { useCountries } from '../hooks/useCountries'
import useCustomNavigate from '../hooks/useCustomNavigate'
import {
  createTaxClassForm,
  toTaxClass,
  type Tax,
  type TaxClassFormFields,
} from '../models/Tax.model'
import { EmployeeDomains } from '../configs/accessControls'
import { listPath } from '../constants/paths'
import styles from './TaxClassPage.module.scss'

const TaxClassPage = () => {
  const { t, i18n } = useTranslation()
  const { countryCode: routeCountry, taxClassCode } = useParams()
  const isEdit = !!routeCountry && !!taxClassCode
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.TAXES_MANAGER)
  const { tenant } = useDashboardContext()
  const { getTax, addTaxClass, updateTaxClasses } = useTaxesApi()
  const { activeCountriesDropdownOptions } = useCountries()
  const trackRequest = useRef(createRequestTracker()).current

  const [tax, setTax] = useState<Tax>()
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, errors },
  } = useForm<TaxClassFormFields>({ defaultValues: createTaxClassForm() })

  // Which tenant + record the form holds. Until it matches the current one,
  // the form cannot be edited or saved.
  const currentKey = isEdit ? `${tenant}:${routeCountry}:${taxClassCode}` : ''
  const [loadedKey, setLoadedKey] = useState<string>()
  const isLoaded = !isEdit || loadedKey === currentKey
  const isLocked = !canManage || !isLoaded

  // A tenant switch returns to the list; the record belongs to the old tenant.
  const previousTenant = useRef(tenant)
  useEffect(() => {
    if (previousTenant.current !== tenant) {
      previousTenant.current = tenant
      navigate(listPath())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  useEffect(() => {
    setTax(undefined)
    setLoadedKey(undefined)
    reset(createTaxClassForm(routeCountry))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCountry, taxClassCode, tenant])

  useEffect(() => {
    if (!isEdit) return
    void loadLatest(
      trackRequest,
      () => makeCall(() => getTax(routeCountry), blockPanel),
      (fetched) => {
        const taxClass = fetched.taxClasses.find(
          (candidate) => candidate.code === taxClassCode
        )
        if (!taxClass) {
          showError(t('taxes.toast.errorNoTaxClass'))
          return
        }
        setTax(fetched)
        reset(createTaxClassForm(routeCountry, taxClass))
        setLoadedKey(currentKey)
      },
      (e: unknown) => {
        showError(t('taxes.toast.errorFetch'), getApiErrorDetails(e))
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCountry, taxClassCode, tenant])

  const countryOptions = useMemo(() => {
    const current = routeCountry
    if (
      !current ||
      activeCountriesDropdownOptions.some((option) => option.value === current)
    ) {
      return activeCountriesDropdownOptions
    }
    // The country of a stored record may be inactive.
    return [
      ...activeCountriesDropdownOptions,
      { label: `${current} - ${t('global.inactive')}`, value: current },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCountriesDropdownOptions, routeCountry, i18n.language, t])

  const duplicateMessage = t('taxes.validation.codeDuplicate')

  const submit = async (data: TaxClassFormFields) => {
    if (isEdit) {
      if (!tax) return
      const duplicate = tax.taxClasses.some(
        (c) => c.code === data.code && c.code !== taxClassCode
      )
      if (duplicate) {
        setError('code', { type: 'duplicate', message: duplicateMessage })
        return
      }
    }

    try {
      blockPanel(true)
      if (isEdit && tax) {
        await updateTaxClasses(
          tax,
          tax.taxClasses.map((c) =>
            c.code === taxClassCode ? toTaxClass(data, c) : c
          )
        )
        showSuccess(t('taxes.toast.successTaxClassEdited'))
      } else {
        await addTaxClass(data.countryCode, toTaxClass(data))
        showSuccess(t('taxes.toast.successTaxClassAdded'))
      }
      reset(data)
      navigate(listPath())
    } catch (e: unknown) {
      if (e instanceof DuplicateTaxClassError) {
        setError('code', { type: 'duplicate', message: duplicateMessage })
        return
      }
      // The form keeps the entered values.
      showError(t('taxes.toast.errorSave'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  return (
    <>
      <HeaderSection
        title={t('taxes.singular')}
        subtitle={isEdit ? `${routeCountry} - ${taxClassCode}` : undefined}
        backTo={listPath()}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!isDirty || isLocked}
              onClick={() => reset()}
              data-testid="tax-class-discard"
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!isDirty || isLocked}
              onClick={handleSubmit(submit)}
              data-testid="tax-class-save"
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <SectionBox>
        <FormGrid className={styles.form}>
          <Controller
            name="countryCode"
            control={control}
            rules={{ required: t('taxes.validation.countryRequired') }}
            render={({ field }) => (
              <Dropdown
                label={t('taxes.label.countryCode')}
                required
                filter
                placeholder={t('taxes.placeholder.country')}
                options={countryOptions}
                value={field.value || null}
                onChange={(event) =>
                  field.onChange(
                    typeof event.value === 'string' ? event.value : ''
                  )
                }
                error={errors.countryCode?.message}
                disabled={isEdit || isLocked}
                data-testid="tax-class-country"
              />
            )}
          />
          <Controller
            name="rate"
            control={control}
            render={({ field }) => (
              <InputNumber
                label={t('taxes.label.taxRate')}
                suffix="%"
                locale={i18n.language}
                minFractionDigits={0}
                maxFractionDigits={1}
                value={field.value}
                onChange={(event) => field.onChange(event.value)}
                disabled={isLocked}
                data-testid="tax-class-rate"
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{
              validate: (value) =>
                !!value.trim() || t('taxes.validation.codeRequired'),
            }}
            render={({ field }) => (
              <InputText
                label={t('taxes.label.taxCode')}
                required
                value={field.value}
                onChange={(event) =>
                  field.onChange(event.target.value.toUpperCase())
                }
                error={errors.code?.message}
                disabled={isLocked}
                data-testid="tax-class-code"
              />
            )}
          />
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <LocalizedInput
                label={t('taxes.label.taxName')}
                value={field.value}
                onChange={(value) => field.onChange(value ?? {})}
                disabled={isLocked}
                data-testid="tax-class-name"
              />
            )}
          />
          <div className={styles.wide}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <LocalizedInput
                  label={t('taxes.label.taxDescription')}
                  textarea
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? {})}
                  disabled={isLocked}
                  data-testid="tax-class-description"
                />
              )}
            />
          </div>
        </FormGrid>
      </SectionBox>
    </>
  )
}

export default TaxClassPage
