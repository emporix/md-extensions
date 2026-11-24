import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import getSymbolFromCurrency from 'currency-symbol-map'
import {
  DataTable,
  Dropdown,
  InputNumber,
  MoneyValue,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { Item, Quote } from '../../models/Quotes.model'
import { ShippingMethod } from '../../models/Shipping.model'
import type { QuotePreviewForm } from './QuotesTabPreview'
import { useQuoteData } from '../../context/Quote.provider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuotesMatchPrices } from '../../hooks/useQuotesMatchPrices'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useShippingApi } from '../../hooks/api/shipping'
import { useTaxesApi } from '../../hooks/api/taxes'
import { numericColumn } from '../shared/NumericColumn'
import InputField from '../shared/InputField'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import {
  calculateQuoteItemsSubtotal,
  filterQuoteShippingMethods,
  getZoneShippingMethods,
  selectShippingFee,
} from '../../helpers/quoteShipping.helpers'
import {
  MAX_ITEM_DISCOUNT,
  MIN_ITEM_DISCOUNT,
  getUnitPriceForNetValue,
  limitItemDiscount,
} from '../../helpers/quoteItems.helpers'
import { getApiErrorDetails } from '../../helpers/api'
import styles from './QuotesTabPreviewTable.module.scss'

interface QuotesTabProductsProps extends StylableProps {
  control: Control<QuotePreviewForm>
  getValues: UseFormGetValues<QuotePreviewForm>
  watch: UseFormWatch<QuotePreviewForm>
  setValue: UseFormSetValue<QuotePreviewForm>
}

interface RowOption {
  rowIndex: number
}

/**
 * Five lines per page by default. MD's rows-per-page choice only went back to
 * the first page (the rows stayed 5); the choice now applies (COP-7116 QA).
 */
const PREVIEW_ROWS = 5
const PREVIEW_ROWS_PER_PAGE_OPTIONS = [5, 10, 15]

/**
 * MD `QuotesTabPreviewTable`: the quote lines with editable quantity, net
 * price and discount, the shipping method of the shipping country's zones
 * and the totals.
 */
const QuotesTabPreviewTable = (props: QuotesTabProductsProps) => {
  const { className = '', control, getValues, watch, setValue } = props
  const { t, i18n } = useTranslation()
  const { getPriceForQuoteItems } = useQuotesMatchPrices()
  const { quote, isQuoteCompleted } = useQuoteData()
  const { getContentLangValue } = useLocalizedValue()
  const { calculateTax } = useTaxesApi()
  const { getZones } = useShippingApi()
  const toast = useToast()
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>()
  const [filteredShippingMethods, setFilteredShippingMethods] =
    useState<ShippingMethod[]>()
  const [subtotal, setSubtotal] = useState<number>(0)
  const [calcSubtotal, setCalcSubtotal] = useState<number>(0)
  const [first, setFirst] = useState(0)
  const [rows, setRows] = useState(PREVIEW_ROWS)
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)

  useEffect(() => {
    if (!quote) return
    ;(async () => {
      // MD left a failed request unhandled: the required method list stayed
      // empty with no message.
      try {
        const zones = await getZones(quote.siteCode)
        setShippingMethods(
          getZoneShippingMethods(zones, quote?.shippingAddress?.countryCode)
        )
      } catch (e) {
        console.error(e)
        toast.showError(
          t('quotes.toasts.errorFetchShippingMethods'),
          getApiErrorDetails(e)
        )
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: on mount
  }, [])

  useEffect(() => {
    setSubtotal(calculateQuoteItemsSubtotal(getValues('items')))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [calcSubtotal, shippingMethods])

  useEffect(() => {
    updateFilteredShippingMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [subtotal, shippingMethods])

  useEffect(() => {
    ;(async () => {
      await updateSelectedShippingMethod()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [filteredShippingMethods])

  const calculateDiscount = (unitPrice: number, newUnitPrice: number) => {
    return ((unitPrice - newUnitPrice) / unitPrice) * 100
  }

  const mapShippingMethodToQuoteShipping = async (method: ShippingMethod) => {
    const fee = selectShippingFee(method, subtotal)
    const value = fee.cost.amount
    const grossValue = !method.shippingTaxCode
      ? value
      : await calculateTax(
          value,
          quote?.shippingAddress.countryCode,
          method.shippingTaxCode
        )
    return {
      methodName: method.name,
      value: value,
      methodId: method.id,
      zoneId: method.zoneId || '',
      shippingTaxCode: method.shippingTaxCode || '',
      grossValue: grossValue,
    }
  }

  const updateFilteredShippingMethods = () => {
    if (!shippingMethods) {
      return
    }
    setFilteredShippingMethods(
      filterQuoteShippingMethods(shippingMethods, subtotal, quote?.currency)
    )
  }

  const updateSelectedShippingMethod = async () => {
    if (!shippingMethods) return
    const availableShippingMethod = filteredShippingMethods?.find(
      (m) => m.id === getValues('shipping')?.methodId
    )
    if (availableShippingMethod) {
      const methodWithNewPrices = await mapShippingMethodToQuoteShipping(
        availableShippingMethod
      )
      setValue('shipping', methodWithNewPrices)
    } else {
      setValue('shipping', undefined)
    }
  }

  const onQuantityChange = async (quantity: number, index: number) => {
    let matchedUnitPrice: number | undefined
    try {
      const itemsWithNewPrice = await getPriceForQuoteItems(quote as Quote, [
        getValues(`items.${index}`),
      ])
      matchedUnitPrice = itemsWithNewPrice[0].price?.unitPrice
    } catch (e) {
      // MD left this rejection unhandled: no message, and the line kept its
      // old totals. The line is recomputed with its current price instead.
      console.error(e)
      toast.showError(
        t('quotes.toasts.errorFetchPrices'),
        getApiErrorDetails(e)
      )
    }
    const currentUnitPrice = getValues(`items.${index}.price.unitPrice`)
    const unitPrice = matchedUnitPrice || currentUnitPrice
    const currentNewUnitPrice =
      getValues(`items.${index}.price.newUnitPrice`) ?? 0
    // A new quantity can reach another price tier. MD kept the line's unit
    // price and recomputed the discount against the new list price, so a
    // cheaper tier gave a negative discount and a higher total (COP-7116 QA).
    // The line keeps its discount instead, and its unit price follows the
    // list price.
    const newUnitPrice =
      unitPrice === currentUnitPrice
        ? currentNewUnitPrice
        : unitPrice *
          (1 - (getValues(`items.${index}.price.discount`) ?? 0) / 100)
    const totalNetValue = newUnitPrice * quantity
    const discount = calculateDiscount(unitPrice, newUnitPrice)
    setValue(`items.${index}.price.totalNetValue`, totalNetValue, {
      shouldDirty: true,
    })
    setValue(`items.${index}.price.unitPrice`, unitPrice, {
      shouldDirty: true,
    })
    setValue(`items.${index}.price.newUnitPrice`, newUnitPrice, {
      shouldDirty: true,
    })
    setValue(`items.${index}.price.discount`, discount, {
      shouldDirty: true,
    })
    setCalcSubtotal(new Date().getTime())
  }

  /** Applies a typed net value and returns the net value the line keeps. */
  const onTotalNetValueChange = (
    totalNetValue: number,
    index: number
  ): number => {
    const quantity = getValues(`items.${index}.quantity.quantity`)
    const newUnitPrice = getUnitPriceForNetValue(totalNetValue, quantity)
    // Without a quantity there is no unit price, so the net value stays 0.
    if (newUnitPrice === undefined) return 0
    const discount = calculateDiscount(
      getValues(`items.${index}.price.unitPrice`),
      newUnitPrice
    )
    setValue(`items.${index}.price.newUnitPrice`, newUnitPrice, {
      shouldDirty: true,
    })
    setValue(`items.${index}.price.discount`, discount, {
      shouldDirty: true,
    })
    setCalcSubtotal(new Date().getTime())
    return totalNetValue
  }

  const onDiscountChange = (discount: number, index: number) => {
    const newUnitPrice =
      getValues(`items.${index}.price.unitPrice`) * (1 - discount / 100)
    const newTotalNetValue =
      newUnitPrice * getValues(`items.${index}.quantity.quantity`)
    setValue(`items.${index}.price.totalNetValue`, newTotalNetValue, {
      shouldDirty: true,
    })
    setValue(`items.${index}.price.newUnitPrice`, newUnitPrice, {
      shouldDirty: true,
    })
    setCalcSubtotal(new Date().getTime())
  }

  const columns = (): DataTableColumnProps[] => {
    if (!quote?.currency) return []
    const currency = quote?.currency
    const TABLE_NAME = 'quotes.tabs.preview.table'
    return [
      {
        columnKey: 'name',
        header: t(`${TABLE_NAME}.name`),
        body: (rowData: Item) => getContentLangValue(rowData.product.name),
      },
      {
        columnKey: 'quantity',
        header: t(`${TABLE_NAME}.quantity`),
        body: (_: Item, o: RowOption) => {
          return (
            <Controller
              name={`items.${o.rowIndex}.quantity.quantity`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  className={styles.quantityInput}
                  readOnly={isQuoteCompleted || !canManage}
                  locale={i18n.language}
                  maxFractionDigits={3}
                  min={0}
                  value={field.value}
                  onChange={async (e) => {
                    if (e.value === undefined || e.value === null) return
                    field.onChange(e.value)
                    await onQuantityChange(e.value, o.rowIndex)
                  }}
                  data-testid={`quote-item-quantity-${o.rowIndex}`}
                />
              )}
            />
          )
        },
        ...numericColumn,
      },
      {
        columnKey: 'unitCode',
        header: t(`${TABLE_NAME}.unitCode`),
        body: (rowData: Item) => rowData.quantity?.unitCode,
      },
      {
        columnKey: 'unitPrice',
        header: t(`${TABLE_NAME}.unitPrice`),
        body: (_: Item, o: RowOption) => {
          return (
            <MoneyValue
              currency={currency}
              value={watch(`items.${o.rowIndex}.price.unitPrice`)}
              locale={i18n.language}
            />
          )
        },
        ...numericColumn,
      },
      {
        columnKey: 'newUnitPrice',
        header: t(`${TABLE_NAME}.newUnitPrice`),
        body: (_: Item, o: RowOption) => {
          return (
            <MoneyValue
              currency={currency}
              value={watch(`items.${o.rowIndex}.price.newUnitPrice`)}
              locale={i18n.language}
            />
          )
        },
        ...numericColumn,
      },
      {
        columnKey: 'netPrice',
        header: t(`${TABLE_NAME}.netPrice`),
        body: (_: Item, o: RowOption) => {
          return (
            <Controller
              name={`items.${o.rowIndex}.price.totalNetValue`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  className={styles.netPriceInput}
                  readOnly={isQuoteCompleted || !canManage}
                  locale={i18n.language}
                  value={field.value}
                  allowEmpty={false}
                  prefix={getSymbolFromCurrency(currency) + ' '}
                  min={0}
                  maxFractionDigits={2}
                  minFractionDigits={2}
                  onChange={(e) => {
                    if (e.value === undefined || e.value === null) return
                    field.onChange(onTotalNetValueChange(e.value, o.rowIndex))
                  }}
                  data-testid={`quote-item-net-price-${o.rowIndex}`}
                />
              )}
            />
          )
        },
        ...numericColumn,
        headerStyle: { paddingRight: '24px' },
      },
      {
        columnKey: 'tax',
        header: t(`${TABLE_NAME}.tax`),
        // A price can come back without `tax` (MD showed "undefined%").
        body: (rowData: Item) =>
          typeof rowData.price?.tax?.taxRate === 'number'
            ? `${rowData.price.tax.taxRate}%`
            : '',
        ...numericColumn,
        bodyStyle: { paddingRight: '14px' },
      },
      {
        columnKey: 'discount',
        header: t(`${TABLE_NAME}.discount`),
        body: (_: Item, o: RowOption) => {
          return (
            <Controller
              name={`items.${o.rowIndex}.price.discount`}
              control={control}
              render={({ field }) => (
                <InputNumber
                  className={styles.quantityInput}
                  readOnly={isQuoteCompleted || !canManage}
                  locale={i18n.language}
                  maxFractionDigits={1}
                  suffix={'%'}
                  // A discount is typed as 0-100% (MD took any number, so
                  // 125% gave negative prices); a minimum of 0 also blocks
                  // the minus sign. A net price above the list price gives a
                  // negative discount, which is the minimum then: PrimeReact
                  // shows a value under the minimum as the minimum.
                  min={Math.min(MIN_ITEM_DISCOUNT, field.value ?? 0)}
                  max={MAX_ITEM_DISCOUNT}
                  value={field.value}
                  onChange={(e) => {
                    // PrimeReact reports the typed number before its limits
                    // (it applies them on blur, which the library does not
                    // report) and a lone minus sign as '-', so the form gets
                    // the limited number only.
                    if (typeof e.value !== 'number') return
                    const discount = limitItemDiscount(e.value)
                    onDiscountChange(discount, o.rowIndex)
                    field.onChange(discount)
                  }}
                  data-testid={`quote-item-discount-${o.rowIndex}`}
                />
              )}
            />
          )
        },
        ...numericColumn,
      },
      {
        columnKey: 'grossPrice',
        header: t(`${TABLE_NAME}.grossPrice`),
        body: (rowData: Item, o: RowOption) => {
          // Without a tax rate the gross is unknown. MD read
          // `price.tax.taxRate` unchecked, so a line without `tax` crashed the
          // page (COP-7116 QA).
          const taxRate = rowData.price?.tax?.taxRate
          if (typeof taxRate !== 'number') return null
          const value =
            watch(`items.${o.rowIndex}.price.totalNetValue`) *
            (1 + taxRate / 100)
          return (
            <MoneyValue
              currency={currency}
              value={value}
              locale={i18n.language}
            />
          )
        },
        ...numericColumn,
      },
    ]
  }

  const shippingOptions = (filteredShippingMethods ?? []).map((method) => ({
    label: getContentLangValue(method.name),
    value: method.id,
  }))

  return (
    <div className={className}>
      <DataTable
        value={getValues('items')}
        columns={columns()}
        showFilter={false}
        pagination={{
          first,
          rows,
          rowsPerPageOptions: PREVIEW_ROWS_PER_PAGE_OPTIONS,
        }}
        onPage={(event) => {
          setFirst(event.first)
          setRows(event.rows)
        }}
        currentPageReportTemplate={t('global.pagination')}
        emptyMessage={t('global.noDataFound')}
        data-testid="quote-preview-table"
      />
      <div className={styles.subtotal}>
        <InputField
          label={t('quotes.tabs.preview.shippingMethod')}
          className={styles.shippingField}
          required
        >
          <Controller
            name={`shipping`}
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                disabled={isQuoteCompleted || !canManage}
                placeholder=""
                options={shippingOptions}
                value={
                  filteredShippingMethods?.find(
                    (m) => m.id === watch('shipping')?.methodId
                  )?.id ?? null
                }
                onChange={async (e) => {
                  const method = filteredShippingMethods?.find(
                    (m) => m.id === e.value
                  ) as ShippingMethod
                  const value = await mapShippingMethodToQuoteShipping(method)
                  field.onChange(value)
                }}
                data-testid="quote-shipping-method"
              />
            )}
          />
        </InputField>
        <TableTotalCost
          subtotal={subtotal}
          shippingCost={watch('shipping')?.grossValue}
          currency={quote?.currency as string}
        ></TableTotalCost>
      </div>
    </div>
  )
}

const TableTotalCost = (props: {
  subtotal: number
  shippingCost: number | undefined
  currency: string
  className?: string
}) => {
  const { subtotal, shippingCost, currency, className = '' } = props
  const { t } = useTranslation()
  return (
    <div className={[styles.totals, className].filter(Boolean).join(' ')}>
      <TableTotalCostRow
        value={subtotal}
        currency={currency}
        title={t('quotes.tabs.preview.subtotal')}
      />
      <TableTotalCostRow
        value={shippingCost}
        currency={currency}
        title={t('quotes.tabs.preview.shippingCost')}
      />
      <TableTotalCostRow
        className={styles.total}
        value={shippingCost !== undefined ? subtotal + shippingCost : subtotal}
        currency={currency}
        title={t('quotes.tabs.preview.total')}
      />
    </div>
  )
}

const TableTotalCostRow = (props: {
  value: number | undefined
  currency: string
  title: string
  className?: string
}) => {
  const { value, currency, title, className = '' } = props
  const { i18n } = useTranslation()
  return (
    <div className={[styles.totalRow, className].filter(Boolean).join(' ')}>
      <span>{title}:</span>
      {value === undefined || isNaN(value) ? (
        <span>--</span>
      ) : (
        <MoneyValue value={value} currency={currency} locale={i18n.language} />
      )}
    </div>
  )
}

export default QuotesTabPreviewTable
