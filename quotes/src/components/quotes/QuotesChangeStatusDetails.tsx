import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Dropdown,
  InputText,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import InputField from '../shared/InputField'
import { QuoteChangeStatusType, QuoteReason } from '../../models/Quotes.model'
import { useQuotesApi } from '../../hooks/api/quotes'
import { StylableProps } from '../../helpers/props'
import { getApiErrorMessage } from '../../helpers/api'
import {
  filterQuoteReasonsByType,
  QuoteChangeStatusFormData,
  toQuoteChangeStatusFormData,
} from '../../helpers/quoteChangeStatus.helpers'
import styles from './QuotesChangeStatus.module.scss'

interface QuotesChangeStatusDetailsProps extends StylableProps {
  changeType: QuoteChangeStatusType
  onCancel: () => void
  onSubmit: (formData: QuoteChangeStatusFormData) => void
}

interface QuotesChangeStatusDetailsForm {
  reason: QuoteReason | undefined
  comment: string
}

/**
 * Reason (decline only, required — COP-7116; MD let it be empty) and comment
 * of an approve or decline; submitting goes to the confirm step.
 */
const QuotesChangeStatusDetails = (props: QuotesChangeStatusDetailsProps) => {
  const { className = '', changeType, onCancel, onSubmit } = props
  const { t } = useTranslation()
  const toast = useToast()
  const { getQuotesReasons } = useQuotesApi()
  const [reasonsOptions, setReasonsOptions] = useState<QuoteReason[]>([])
  const { control, handleSubmit, formState } =
    useForm<QuotesChangeStatusDetailsForm>()

  useEffect(() => {
    ;(async () => {
      await getReasons()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: once
  }, [])

  const getReasons = useCallback(async () => {
    if (changeType !== QuoteChangeStatusType.decline) return
    try {
      const reasons = await getQuotesReasons()
      setReasonsOptions(
        filterQuoteReasonsByType(
          reasons.data as unknown as QuoteReason[],
          changeType
        )
      )
    } catch (e: unknown) {
      console.error(e)
      toast.showToast(
        getApiErrorMessage(e) ?? t('quotes.toasts.errorFetchReasons'),
        '',
        'error'
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [])

  const onFormSubmit = useCallback(
    (data: QuotesChangeStatusDetailsForm) => {
      onSubmit(toQuoteChangeStatusFormData(data))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState]
  )

  const getBtnLabel = useMemo(() => {
    if (changeType === QuoteChangeStatusType.change) {
      return t('quotes.dialog.status.form.submitUpdate')
    } else if (changeType === QuoteChangeStatusType.decline) {
      return t('quotes.dialog.status.form.submitDecline')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [changeType])

  const reasonOptions = useMemo(
    () =>
      reasonsOptions.map((reason) => ({
        label: reason.code,
        value: reason.id,
      })),
    [reasonsOptions]
  )

  return (
    <div className={className}>
      {changeType === QuoteChangeStatusType.decline && (
        <InputField
          label={t('quotes.dialog.status.form.reason')}
          className={styles.reasonField}
          required
        >
          <Controller
            name="reason"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                placeholder=""
                options={reasonOptions}
                value={field.value?.id ?? null}
                onChange={(e) => {
                  field.onChange(
                    reasonsOptions.find((reason) => reason.id === e.value)
                  )
                }}
                data-testid="quote-status-reason"
              />
            )}
          />
        </InputField>
      )}
      <InputField
        label={t('quotes.dialog.status.form.comment')}
        name="quote-status-comment-input"
        className={styles.commentField}
      >
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <InputText
              inputId="quote-status-comment-input"
              textarea
              rows={6}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value || '')}
              data-testid="quote-status-comment"
            />
          )}
        />
      </InputField>
      <div className={styles.buttons}>
        <SecondaryButton onClick={onCancel}>
          {t('global.discard')}
        </SecondaryButton>
        <PrimaryButton
          disabled={!formState.isValid}
          onClick={handleSubmit(onFormSubmit)}
        >
          {getBtnLabel}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default QuotesChangeStatusDetails
