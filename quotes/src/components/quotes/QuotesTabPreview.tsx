import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Calendar,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  SectionTitle,
  useToast,
} from '@emporix/component-library'
import EmptyContent from '../shared/EmptyContent'
import InputField from '../shared/InputField'
import QuotesTabPreviewTable from './QuotesTabPreviewTable'
import { useQuoteData } from '../../context/Quote.provider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuotesApi } from '../../hooks/api/quotes'
import { Item, QuoteEditOp, Shipping } from '../../models/Quotes.model'
import { compareObjects } from '../mixins/mixins.utils'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import styles from './QuotesTabPreview.module.scss'

export interface QuotePreviewForm {
  validTo: string
  comment: string
  customerReference: string
  customerComment: string
  items: Item[]
  shipping: Shipping | undefined
}

/**
 * MD `QuotesTabPreview`: the priced lines with shipping (Preview table), the
 * validity and comment, and the customer's reference and comment.
 */
const QuotesTabPreview = (props: StylableProps) => {
  const { className = '' } = props
  const { quote, isQuoteCompleted, refreshData } = useQuoteData()
  const { blockPanel } = useUIBlocker()
  const { t } = useTranslation()
  const toast = useToast()
  const { updateQuote } = useQuotesApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)
  const {
    reset,
    control,
    formState,
    handleSubmit,
    getValues,
    setValue,
    watch,
  } = useForm<QuotePreviewForm>({
    defaultValues: {
      validTo: '',
      comment: undefined,
      customerReference: '',
      customerComment: '',
      items: [],
      shipping: undefined,
    },
  })

  useEffect(() => {
    if (!quote) return
    reset({
      validTo: quote.validTo,
      comment: quote.comment?.employeeComment,
      customerReference: quote.customerReference ?? '',
      customerComment: quote.customerComment ?? '',
      items: quote.items || [],
      shipping: quote.shipping,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quote])

  const onSubmit = useCallback(
    async (data: QuotePreviewForm) => {
      if (!quote || !formState.defaultValues) return
      const updateOperations = []
      const dirtyFields = compareObjects(
        formState.defaultValues as QuotePreviewForm,
        data
      )

      if ('validTo' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/validTo',
          value: data.validTo,
        })
      }
      if ('comment' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/comment',
          value: data.comment || '',
        })
      }
      if ('customerReference' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/customerReference',
          value: data.customerReference || '',
        })
      }
      if ('items' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/items',
          value: data.items,
        })
      }
      if ('shipping' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/shipping',
          value: data.shipping,
        })
      }

      blockPanel(true)
      try {
        await updateQuote(quote.id, updateOperations)
        toast.showToast(t('quotes.toasts.successUpdate'), '', 'success')
        refreshData()
      } catch (e) {
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState]
  )

  const formActions = (
    <div className={styles.actions}>
      <SecondaryButton
        disabled={!formState.isDirty || !canManage}
        onClick={() => reset()}
      >
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        disabled={
          !formState.isValid ||
          !formState.isDirty ||
          isQuoteCompleted ||
          !canManage
        }
        onClick={handleSubmit(onSubmit)}
      >
        {t('global.save')}
      </PrimaryButton>
    </div>
  )

  return (
    <div className={className}>
      {quote?.items && quote.items.length > 0 ? (
        <>
          <SectionTitle
            className={styles.tableTitle}
            name={t('quotes.tabs.preview.selectedProducts')}
            actions={formActions}
          />
          <QuotesTabPreviewTable
            className={styles.table}
            control={control}
            getValues={getValues}
            watch={watch}
            setValue={setValue}
          />
        </>
      ) : (
        <SectionBox
          className={styles.emptySection}
          name={t('quotes.tabs.preview.selectedProducts')}
          actions={formActions}
        >
          <EmptyContent
            className={styles.empty}
            text={t('quotes.tabs.preview.selectedProductsEmpty')}
          />
        </SectionBox>
      )}

      <SectionBox
        className={styles.section}
        name={t('quotes.tabs.preview.additionalInformation')}
      >
        <InputField
          className={styles.field}
          label={t('quotes.tabs.preview.validity')}
          required={true}
        >
          <Controller
            name="validTo"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Calendar
                showTime
                disabled={isQuoteCompleted || !canManage}
                hideOnDateTimeSelect
                minDate={new Date()}
                // MD's Prime locale date format of the UI language.
                dateFormat={t('global.dateFormat')}
                value={new Date(field.value)}
                onChange={(event) => {
                  field.onChange((event.target.value as Date).toISOString())
                }}
                data-testid="quote-valid-to"
              />
            )}
          />
        </InputField>
        <InputField
          className={styles.editor}
          label={t('quotes.tabs.preview.comment')}
        >
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <InputText
                textarea
                rows={6}
                value={field.value ?? ''}
                readOnly={isQuoteCompleted || !canManage}
                onChange={(ev) => field.onChange(ev.target.value || '')}
                data-testid="quote-comment"
              />
            )}
          />
        </InputField>
      </SectionBox>

      <SectionBox
        className={styles.section}
        name={t('quotes.tabs.preview.customerInformation')}
      >
        <InputField
          className={styles.field}
          label={t('quotes.tabs.preview.customerReference')}
        >
          <Controller
            name="customerReference"
            control={control}
            render={({ field }) => (
              <InputText
                value={field.value}
                readOnly={isQuoteCompleted || !canManage}
                onChange={(ev) => field.onChange(ev.target.value || '')}
                data-testid="quote-customer-reference"
              />
            )}
          />
        </InputField>
        <InputField
          className={styles.editor}
          label={t('quotes.tabs.preview.customerComment')}
        >
          <Controller
            name="customerComment"
            control={control}
            render={({ field }) => (
              <InputText
                textarea
                rows={4}
                value={field.value}
                readOnly={true}
                onChange={(ev) => field.onChange(ev.target.value || '')}
                data-testid="quote-customer-comment"
              />
            )}
          />
        </InputField>
      </SectionBox>
    </div>
  )
}

export default QuotesTabPreview
