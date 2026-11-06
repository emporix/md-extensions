import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import {
  Dropdown,
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
  getApiErrorDetailsField,
  getApiErrorMessage,
  loadLatest,
  makeCall,
} from '../helpers/api'
import { useDashboardContext } from '../context/Dashboard.context'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { useQuoteReasonsApi } from '../hooks/api/quoteReasons'
import useCustomNavigate from '../hooks/useCustomNavigate'
import {
  QUOTE_REASON_TYPES,
  createQuoteReasonForm,
  isMessageEmpty,
  toQuoteReasonPayload,
  type QuoteReason,
  type QuoteReasonFormFields,
} from '../models/QuoteReason.model'
import { EmployeeDomains } from '../configs/accessControls'
import { listPath, statusCodeDetailPath } from '../constants/paths'
import styles from './StatusCodePage.module.scss'

const StatusCodePage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.STATUS_CODES_MANAGER)
  const { refresh, setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const { getQuoteReason, createQuoteReason, editQuoteReason } =
    useQuoteReasonsApi()
  const trackRequest = useRef(createRequestTracker()).current

  const [reason, setReason] = useState<QuoteReason>()
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<QuoteReasonFormFields>({
    mode: 'onChange',
    defaultValues: createQuoteReasonForm(),
  })

  const typeOptions = useMemo(
    () => QUOTE_REASON_TYPES.map((type) => ({ label: type, value: type })),
    []
  )

  // The host can switch tenant without remounting this page; a save reloads
  // through `refresh`. Responses a newer load superseded are dropped.
  useEffect(() => {
    if (!id) {
      return
    }

    void loadLatest(
      trackRequest,
      () => makeCall(() => getQuoteReason(id), blockPanel),
      (fetched) => {
        setReason(fetched)
        reset(createQuoteReasonForm(fetched))
      },
      (e: unknown) => {
        showError(t('quotesReasons.toasts.errorFetch'), getApiErrorDetails(e))
        navigate(listPath(), { replace: true })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tenant, refresh])

  const submit = async (data: QuoteReasonFormFields) => {
    try {
      if (id) {
        await makeCall(
          () => editQuoteReason(id, toQuoteReasonPayload(data, reason)),
          blockPanel
        )
        showSuccess(t('quotesReasons.toasts.successUpdate'))
        setRefreshValue()
        return
      }

      const newId = await makeCall(
        () => createQuoteReason(toQuoteReasonPayload(data)),
        blockPanel
      )
      showSuccess(t('quotesReasons.toasts.successCreate'))
      navigate(statusCodeDetailPath(newId), { replace: true })
    } catch (e: unknown) {
      // MD showed the service message; the form keeps the entered values.
      showError(
        getApiErrorMessage(e) ?? t('quotesReasons.toasts.errorSave'),
        getApiErrorDetailsField(e)
      )
    }
  }

  return (
    <>
      <HeaderSection
        title={t('quotesReasons.singular')}
        subtitle={id}
        backTo={listPath()}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!isDirty || !canManage}
              onClick={() => reset()}
              data-testid="status-code-discard"
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!isDirty || !isValid || !canManage}
              onClick={handleSubmit(submit)}
              data-testid="status-code-save"
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <SectionBox name={t('quotesReasons.form.details')}>
        <FormGrid>
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                label={t('quotesReasons.form.labels.type')}
                required
                options={typeOptions}
                value={field.value}
                onChange={(event) => field.onChange(event.value)}
                disabled={!canManage}
                data-testid="status-code-type"
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{ validate: (value) => value.trim().length > 0 }}
            render={({ field, fieldState }) => (
              <InputText
                label={t('quotesReasons.form.labels.code')}
                required
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                disabled={!canManage}
                error={fieldState.error ? t('global.fieldRequired') : undefined}
                data-testid="status-code-code"
              />
            )}
          />
          <Controller
            name="message"
            control={control}
            rules={{ validate: (value) => !isMessageEmpty(value) }}
            render={({ field, fieldState }) => (
              <LocalizedInput
                className={styles.message}
                label={t('quotesReasons.form.labels.message')}
                required
                textarea
                value={field.value}
                onChange={field.onChange}
                disabled={!canManage}
                error={fieldState.error ? t('global.fieldRequired') : undefined}
                data-testid="status-code-message"
              />
            )}
          />
        </FormGrid>
      </SectionBox>
    </>
  )
}

export default StatusCodePage
