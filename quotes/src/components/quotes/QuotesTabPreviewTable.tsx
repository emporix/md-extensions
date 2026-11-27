import { useEffect, useRef, useState } from 'react'
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
import { Item, Quote, Shipping } from '../../models/Quotes.model'
import { ShippingMethod } from '../../models/Shipping.model'
import { TaxClass } from '../../models/Taxes.model'
import type { QuotePreviewForm } from './QuotesTabPreview'
import { useQuoteData } from '../../context/Quote.provider'
import { usePermissions } from '../../context/PermissionsProvider'
import {
  isNoShipToCountryError,
  useQuotesMatchPrices,
} from '../../hooks/useQuotesMatchPrices'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useShippingApi } from '../../hooks/api/shipping'
import { useTaxesApi } from '../../hooks/api/taxes'
import { numericColumn } from '../shared/NumericColumn'
import InputField from '../shared/InputField'
import PriceOnRequestBadge from './PriceOnRequestBadge'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import {
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
import {
  calculateDiscount,
  formatTaxRate,
  grossFromNet,
  hasTaxCalculated,
  isExternalPrice,
  isSameShipping,
  sumGrossValues,
  sumNetValues,
} from '../../helpers/quotePricing.helpers'
import { getApiErrorDetails } from '../../helpers/api'
import styles from './QuotesTabPreviewTable.module.scss'

interface QuotesTabProductsProps extends StylableProps {
  control: Control<QuotePreviewForm>
  getValues: UseFormGetValues<QuotePreviewForm>
  watch: UseFormWatch<QuotePreviewForm>
  setValue: UseFormSetValue<QuotePreviewForm>
  /** Classes of the shipping country, for unpriced and EXTERNAL rows. */
  taxClasses?: TaxClass[]
  taxClassesLoadFailed?: boolean
  taxClassesLoaded?: boolean
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
 * and the totals. Items without a price, quotes without an address and the
 * tax class of hand-entered prices follow COP-7125
 * (emporix/management-dashboard#1707).
 */
const QuotesTabPreviewTable = (props: QuotesTabProductsProps) => {
  const {
    className = '',
    control,
    getValues,
    watch,
    setValue,
    taxClasses = [],
    taxClassesLoadFailed = false,
    taxClassesLoaded = false,
  } = props
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
  // Without a shipping address the tax is unknown (price matching used a
  // fallback country), so only net values are shown: tax rate, tax and gross
  // stay blank. Computing gross here would default the rate to 0 and show a
  // gross equal to net, which is misleading.
  const hasShippingAddress = !!quote?.shippingAddress
  // A class chosen but not saved yet: the loaded rate and gross belong to the
  // old class, so they are not shown (the backend recalculates on save).
  const hasChangedTaxClass = (item: Item, index: number) => {
    const chosen = item.price?.tax?.taxClass
    return (
      typeof chosen === 'string' &&
      chosen.trim() !== '' &&
      chosen !== quote?.items?.[index]?.price?.tax?.taxClass
    )
  }
  // Gross values (subtotal, shipping) only when the whole quote is calculated
  // with tax; otherwise the totals are net, as the backend calculates them.
  const isTaxShown = (items: Item[]) =>
    hasShippingAddress &&
    hasTaxCalculated(items) &&
    !items.some((item, i) => hasChangedTaxClass(item, i))
  const isTaxShownFor = (item: Item, index: number) =>
    hasShippingAddress && !hasChangedTaxClass(item, index)
  // Subscribes the table to every change of the rows (tax class included).
  const chosenClasses = (watch('items') ?? [])
    .map((item) => item.price?.tax?.taxClass ?? '')
    .join('|')
  const notifiedShipping = useRef<string | undefined>(undefined)

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
    const items = getValues('items')
    // Gross only when the backend returned a rate for every priced row: a
    // missing class is not a missing address (the quote stays net only).
    setSubtotal(isTaxShown(items) ? sumGrossValues(items) : sumNetValues(items))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [calcSubtotal, shippingMethods, chosenClasses])

  useEffect(() => {
    // The parent resets the form in its own effect, which runs after this
    // one; the state change re-runs the subtotal effect on the reset values.
    setCalcSubtotal(new Date().getTime())
  }, [quote])

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

  const mapShippingMethodToQuoteShipping = async (
    method: ShippingMethod
  ): Promise<Shipping> => {
    const fee = selectShippingFee(method, subtotal)
    const value = fee.cost.amount
    const grossValue = !method.shippingTaxCode
      ? value
      : await calculateTax(
          value,
          quote?.shippingAddress?.countryCode,
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
    if (!shippingMethods || !hasShippingAddress) return
    const availableShippingMethod = filteredShippingMethods?.find(
      (m) => m.id === getValues('shipping')?.methodId
    )
    const picked = availableShippingMethod
      ? await mapShippingMethodToQuoteShipping(availableShippingMethod)
      : undefined
    applyPickedShipping(picked)
  }

  /**
   * Writes the re-picked shipping into the form. When it differs from the
   * stored `quote.shipping` (the totals moved to another fee, or the method is
   * no longer allowed) the field is marked dirty, so Save is enabled and the
   * next save sends `/shipping`, and the employee is told once. A result equal
   * to the stored shipping stays clean and silent (plain open or refresh).
   */
  const applyPickedShipping = (picked: Shipping | undefined) => {
    // Read-only views (completed quote, no manage permission) never mark the
    // form dirty or toast, even when the tenant's shipping setup has drifted.
    if (
      isQuoteCompleted ||
      !canManage ||
      isSameShipping(picked, quote?.shipping ?? undefined)
    ) {
      setValue('shipping', picked)
      return
    }
    // Validated, so a cleared method disables Save again (it is required with
    // an address). react-hook-form 7.91 keeps `isValid` as it was after a
    // plain `setValue`, which left Save enabled; MD (7.54) disables it.
    setValue('shipping', picked, { shouldDirty: true, shouldValidate: true })
    const key = JSON.stringify(picked ?? null)
    if (notifiedShipping.current === key) return
    notifiedShipping.current = key
    toast.showToast(t('quotes.toasts.shippingUpdated'), '', 'info')
  }

  const onQuantityChange = async (quantity: number, index: number) => {
    // An unpriced row has nothing to re-price.
    if (!getValues(`items.${index}.price`)) {
      setCalcSubtotal(new Date().getTime())
      return
    }
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
        isNoShipToCountryError(e)
          ? t('quotes.toasts.errorNoShipToCountry')
          : t('quotes.toasts.errorFetchPrices'),
        getApiErrorDetails(e)
      )
    }
    const currentUnitPrice = getValues(`items.${index}.price.unitPrice`) ?? 0
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
    setValue(`items.${index}.price.unitPrice`, unitPrice ?? 0, {
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
      (getValues(`items.${index}.price.unitPrice`) ?? 0) * (1 - discount / 100)
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

  /**
   * Net price of a row without a price: a form field of its own
   * (`enteredNetValues`), never a synthetic `price` object. Saving sends it as
   * an EXTERNAL price (`buildItemsUpdateOperations`).
   */
  const unpricedNetPriceInput = (rowIndex: number) => (
    <Controller
      name={`enteredNetValues.${rowIndex}`}
      control={control}
      render={({ field }) => (
        <InputNumber
          className={styles.netPriceInput}
          readOnly={isQuoteCompleted || !canManage}
          locale={i18n.language}
          value={field.value ?? null}
          prefix={getSymbolFromCurrency(quote?.currency ?? '') + ' '}
          min={0}
          maxFractionDigits={2}
          minFractionDigits={2}
          onChange={(e) => field.onChange(e.value ?? null)}
          data-testid={`quote-item-entered-net-price-${rowIndex}`}
        />
      )}
    />
  )

  // Only a hand-entered (EXTERNAL) price carries a class chosen by the
  // employee, and only once the country of the address is known. An item
  // without a price becomes EXTERNAL when its net price is entered.
  const wantsTaxClass = (item: Item) =>
    hasShippingAddress && (!item.price || isExternalPrice(item.price))
  const needsTaxClass = (item: Item) =>
    wantsTaxClass(item) && taxClasses.length > 0
  const taxClassOptions = taxClasses.map((taxClass) => ({
    label: getContentLangValue(taxClass.name) || taxClass.code,
    value: taxClass.code,
  }))
  const hasLoadedNoClasses = taxClasses.length === 0 && taxClassesLoaded
  const rowsNeedTaxClass =
    canManage &&
    !isQuoteCompleted &&
    (getValues('items') ?? []).some(wantsTaxClass)

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
        body: (rowData: Item, o: RowOption) => {
          if (!rowData.price) return <PriceOnRequestBadge />
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
        body: (rowData: Item, o: RowOption) => {
          if (!rowData.price) return null
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
        body: (rowData: Item, o: RowOption) => {
          if (!rowData.price) return unpricedNetPriceInput(o.rowIndex)
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
      ...(rowsNeedTaxClass && taxClasses.length > 0
        ? [
            {
              columnKey: 'taxClass',
              header: t(`${TABLE_NAME}.taxClass`),
              body: (rowData: Item, o: RowOption) => {
                if (!needsTaxClass(rowData)) return null
                const name = !rowData.price
                  ? (`enteredTaxClasses.${o.rowIndex}` as const)
                  : (`items.${o.rowIndex}.price.tax.taxClass` as const)
                return (
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        className={styles.taxClassDropdown}
                        disabled={isQuoteCompleted || !canManage}
                        placeholder={t(
                          'quotes.tabs.preview.taxClassPlaceholder'
                        )}
                        options={taxClassOptions}
                        value={(field.value as string | null) ?? null}
                        onChange={(e) => field.onChange(e.value)}
                        data-testid={`quote-item-tax-class-${o.rowIndex}`}
                      />
                    )}
                  />
                )
              },
            },
          ]
        : []),
      {
        columnKey: 'tax',
        header: t(`${TABLE_NAME}.tax`),
        body: (rowData: Item, o: RowOption) =>
          isTaxShownFor(getValues(`items.${o.rowIndex}`) ?? rowData, o.rowIndex)
            ? formatTaxRate(rowData)
            : '',
        ...numericColumn,
        bodyStyle: { paddingRight: '14px' },
      },
      {
        columnKey: 'discount',
        header: t(`${TABLE_NAME}.discount`),
        body: (rowData: Item, o: RowOption) => {
          if (!rowData.price) return null
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
          if (typeof rowData.price?.tax?.taxRate !== 'number') return null
          if (
            !isTaxShownFor(
              getValues(`items.${o.rowIndex}`) ?? rowData,
              o.rowIndex
            )
          )
            return null
          const value = grossFromNet(
            watch(`items.${o.rowIndex}.price.totalNetValue`) ?? 0,
            rowData.price.tax?.taxRate
          )
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
      {rowsNeedTaxClass && taxClassesLoadFailed && (
        <small className={styles.taxClassMessage}>
          {t('quotes.tabs.preview.taxClassesLoadError')}
        </small>
      )}
      {rowsNeedTaxClass && !taxClassesLoadFailed && hasLoadedNoClasses && (
        <small className={styles.taxClassMessage}>
          {t('quotes.tabs.preview.taxClassesEmpty')}
        </small>
      )}
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
          // Without a shipping address there are no methods; shipping stays
          // optional (COP-7125).
          required={hasShippingAddress}
        >
          <Controller
            name={`shipping`}
            control={control}
            rules={{ required: hasShippingAddress }}
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
          shippingCost={
            isTaxShown(getValues('items') ?? [])
              ? watch('shipping')?.grossValue
              : watch('shipping')?.value
          }
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
