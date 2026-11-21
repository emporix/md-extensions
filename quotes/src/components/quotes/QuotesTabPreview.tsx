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
import UnpricedItemsWarning from './UnpricedItemsWarning'
import { useQuoteData } from '../../context/Quote.provider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useQuoteTaxClasses } from '../../hooks/useQuoteTaxClasses'
import { Item, QuoteEditOp, Shipping } from '../../models/Quotes.model'
import { compareObjects } from '../mixins/mixins.utils'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { getApiErrorMessage } from '../../helpers/api'
import {
  buildItemsUpdateOperations,
  countUnpricedItems,
  isExternalPrice,
  withEditableTax,
} from '../../helpers/quotePricing.helpers'
import styles from './QuotesTabPreview.module.scss'

export interface QuotePreviewForm {
  validTo: string
  comment: string
  customerReference: string
  customerComment: string
  items: Item[]
  /** Net prices typed for rows without a price (COP-7125). */
  enteredNetValues: (number | null)[]
  /** Tax classes chosen for rows without a price (COP-7125). */
  enteredTaxClasses: (string | null)[]
  shipping: Shipping | undefined
}

/**
 * MD `QuotesTabPreview`: the priced lines with shipping (Preview table), the
 * validity and comment, and the customer's reference and comment. Items
 * without a price get a typed net price and an optional tax class (COP-7125,
 * emporix/management-dashboard#1707).
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
  const { taxClasses, loadFailed, loaded } = useQuoteTaxClasses(
    quote?.shippingAddress?.countryCode,
    canManage &&
      !isQuoteCompleted &&
      (quote?.items ?? []).some(
        (item) => !item.price || isExternalPrice(item.price)
      )
  )
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
      enteredNetValues: [],
      enteredTaxClasses: [],
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
      items: withEditableTax(quote.items || []),
      enteredNetValues: (quote.items || []).map(() => null),
      enteredTaxClasses: (quote.items || []).map(() => null),
      shipping: quote.shipping ?? undefined,
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
      if ('items' in dirtyFields || 'enteredNetValues' in dirtyFields) {
        updateOperations.push(
          ...buildItemsUpdateOperations(
            quote.items,
            data.items,
            data.enteredNetValues,
            data.enteredTaxClasses
          )
        )
      }
      if ('shipping' in dirtyFields) {
        updateOperations.push({
          op: QuoteEditOp.replace,
          path: '/shipping',
          value: data.shipping,
        })
      }

      if (updateOperations.length === 0) {
        // Nothing to send (for example a rounding-only difference): drop the
        // edit so the form is clean and Save is not left enabled.
        reset()
        return
      }

      blockPanel(true)
      try {
        await updateQuote(quote.id, updateOperations)
        toast.showToast(t('quotes.toasts.successUpdate'), '', 'success')
        refreshData()
      } catch (e) {
        console.error(e)
        toast.showToast(
          getApiErrorMessage(e) ?? t('quotes.toasts.errorUpdate'),
          '',
          'error'
        )
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState, quote, reset]
  )

  // A class picked for a row without a net price changes nothing on the
  // service: it alone does not make the form saveable.
  const hasSavableChange = Object.keys(formState.dirtyFields).some(
    (key) => key !== 'enteredTaxClasses'
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
          !hasSavableChange ||
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
          {quote.incompletePricing && (
            <UnpricedItemsWarning
              className={styles.warning}
              count={countUnpricedItems(quote.items)}
            />
          )}
          <QuotesTabPreviewTable
            className={styles.table}
            control={control}
            getValues={getValues}
            watch={watch}
            setValue={setValue}
            taxClasses={taxClasses}
            taxClassesLoadFailed={loadFailed}
            taxClassesLoaded={loaded}
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
