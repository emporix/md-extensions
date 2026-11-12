import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import {
  AutoComplete,
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
  getApiErrorStatus,
  loadLatest,
  makeCall,
} from '../helpers/api'
import { useDashboardContext } from '../context/Dashboard.context'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { useUnitsApi } from '../hooks/api/units'
import useCustomNavigate from '../hooks/useCustomNavigate'
import {
  createUnitForm,
  hasName,
  toUnitPayload,
  type Unit,
  type UnitFormFields,
} from '../models/Unit.model'
import { EmployeeDomains } from '../configs/accessControls'
import { listPath, unitAddPath, unitDetailPath } from '../constants/paths'
import styles from './UnitPage.module.scss'

type TypeSuggestion = { label: string }

const UnitPage = () => {
  const { t, i18n } = useTranslation()
  const { code } = useParams()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.UNITS_MANAGER)
  const { refresh, setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const { getUnit, getUnitTypes, createUnit, updateUnit } = useUnitsApi()
  const trackRequest = useRef(createRequestTracker()).current
  const trackTypesRequest = useRef(createRequestTracker()).current

  const [unit, setUnit] = useState<Unit>()
  const [types, setTypes] = useState<string[]>([])
  const [typeSuggestions, setTypeSuggestions] = useState<TypeSuggestion[]>([])
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<UnitFormFields>({
    mode: 'onChange',
    defaultValues: createUnitForm(),
  })

  const baseUnitOptions = useMemo(
    () => [
      { label: t('global.true'), value: 'true' },
      { label: t('global.false'), value: 'false' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, t]
  )

  // Which tenant + code the form holds. Until it matches the current one, the
  // form cannot be edited or saved.
  const currentKey = code ? `${tenant}:${code}` : undefined
  const [loadedKey, setLoadedKey] = useState<string>()
  const isLoaded = !currentKey || loadedKey === currentKey
  const isLocked = !canManage || !isLoaded

  useEffect(() => {
    // Types the tenant already uses; a new one can still be typed.
    void loadLatest(
      trackTypesRequest,
      () => getUnitTypes(),
      (fetched) => setTypes(fetched ?? []),
      () => setTypes([])
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  useEffect(() => {
    // A new tenant or code: drop the previous record and its version so they
    // cannot be saved against the new one.
    setUnit(undefined)
    setLoadedKey(undefined)
    reset(createUnitForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, tenant])

  // The host can switch tenant without remounting this page; a save reloads
  // through `refresh`. Responses a newer load superseded are dropped.
  useEffect(() => {
    if (!code) {
      return
    }

    const key = `${tenant}:${code}`
    void loadLatest(
      trackRequest,
      () => makeCall(() => getUnit(code), blockPanel),
      (fetched) => {
        setUnit(fetched)
        reset(createUnitForm(fetched))
        setLoadedKey(key)
      },
      (e: unknown) => {
        // An unknown code goes to the add page, as in MD. Any other failure
        // keeps the operator on this route.
        if (getApiErrorStatus(e) === 404) {
          showError(t('units.toasts.noUnit'), getApiErrorDetails(e))
          navigate(unitAddPath(), { replace: true })
          return
        }
        showError(t('units.toasts.error'), getApiErrorDetails(e))
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, tenant, refresh])

  const submit = async (data: UnitFormFields) => {
    try {
      if (code) {
        await makeCall(
          () => updateUnit(code, toUnitPayload(data, unit)),
          blockPanel
        )
        showSuccess(t('units.toasts.edit'))
        setRefreshValue()
        return
      }

      await makeCall(() => createUnit(toUnitPayload(data)), blockPanel)
      showSuccess(t('units.toasts.create'))
      navigate(unitDetailPath(data.code), { replace: true })
    } catch (e: unknown) {
      // The form keeps the entered values.
      showError(t('units.toasts.error'), getApiErrorDetails(e))
    }
  }

  const completeType = (query: string) => {
    const needle = query.trim().toLowerCase()
    setTypeSuggestions(
      types
        .filter((type) => type.toLowerCase().includes(needle))
        .map((type) => ({ label: type }))
    )
  }

  return (
    <>
      <HeaderSection
        title={t('units.singular')}
        subtitle={code}
        backTo={listPath()}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!isDirty || isLocked}
              onClick={() => reset()}
              data-testid="unit-discard"
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!isDirty || !isValid || isLocked}
              onClick={handleSubmit(submit)}
              data-testid="unit-save"
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <SectionBox>
        <FormGrid className={styles.form}>
          <Controller
            name="name"
            control={control}
            rules={{ validate: hasName }}
            render={({ field }) => (
              <LocalizedInput
                label={t('units.form.name')}
                required
                value={field.value}
                onChange={(value) => field.onChange(value ?? {})}
                disabled={isLocked}
                data-testid="unit-name"
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{ validate: (value) => value.trim().length > 0 }}
            render={({ field }) => (
              <InputText
                label={t('units.form.code.label')}
                required
                placeholder={t('units.form.code.placeholder')}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                disabled={!!code || isLocked}
                data-testid="unit-code"
              />
            )}
          />
          <Controller
            name="symbol"
            control={control}
            render={({ field }) => (
              <InputText
                label={t('units.form.symbol.label')}
                placeholder={t('units.form.symbol.placeholder')}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                disabled={isLocked}
                data-testid="unit-symbol"
              />
            )}
          />
          <Controller
            name="type"
            control={control}
            rules={{ validate: (value) => value.trim().length > 0 }}
            render={({ field }) => (
              <AutoComplete<TypeSuggestion>
                label={`${t('units.form.type.label')} *`}
                placeholder={t('units.form.type.placeholder')}
                value={field.value}
                suggestions={typeSuggestions}
                field="label"
                dropdown
                completeMethod={(event) => completeType(event.query)}
                onChange={(event) => field.onChange(event.value)}
                onSelect={(event) => field.onChange(event.value.label)}
                disabled={isLocked}
                data-testid="unit-type"
              />
            )}
          />
          <Controller
            name="baseUnit"
            control={control}
            render={({ field }) => (
              <Dropdown
                label={t('units.form.baseUnit')}
                options={baseUnitOptions}
                value={String(field.value)}
                onChange={(event) => field.onChange(event.value === 'true')}
                disabled={isLocked}
                data-testid="unit-base-unit"
              />
            )}
          />
          <Controller
            name="factor"
            control={control}
            render={({ field }) => (
              <InputNumber
                label={t('units.form.factor')}
                mode="decimal"
                locale={i18n.language}
                maxFractionDigits={2}
                value={field.value}
                onChange={(event) => field.onChange(event.value)}
                disabled={isLocked}
                data-testid="unit-factor"
              />
            )}
          />
        </FormGrid>
      </SectionBox>
    </>
  )
}

export default UnitPage
