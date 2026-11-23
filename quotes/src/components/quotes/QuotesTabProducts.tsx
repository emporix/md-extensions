import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { ProductRow } from '@emporix/api-calls'
import {
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import EmptyContent from '../shared/EmptyContent'
import FallbackCountryNotice from './FallbackCountryNotice'
import QuotesTabProductsSelected from './QuotesTabProductsSelected'
import QuotesSelectProductsDialog from './QuotesSelectProductsDialog'
import { useQuoteData } from '../../context/Quote.provider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuotesApi } from '../../hooks/api/quotes'
import {
  isNoShipToCountryError,
  useQuotesMatchPrices,
} from '../../hooks/useQuotesMatchPrices'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Item } from '../../models/Quotes.model'
import { ProductType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { deepClone } from '../../helpers/utils'
import {
  buildQuoteItemsOperations,
  diffQuoteItems,
} from '../../helpers/quoteItems.helpers'
import { getApiErrorMessage } from '../../helpers/api'
import styles from './QuotesTabProducts.module.scss'

export interface QuoteProductsForm {
  products: ProductRow[]
}

/**
 * The picked products, which fill the tab, and a button that opens the
 * products picker in a dialog (MD showed the picker under the list). Save adds
 * the new lines priced by match-prices and removes the dropped ones.
 */
const QuotesTabProducts = (props: StylableProps) => {
  const { className = '' } = props
  const { updateQuote } = useQuotesApi()
  const { t } = useTranslation()
  const { quote, isQuoteCompleted, refreshData } = useQuoteData()
  const { getPriceForQuoteItems } = useQuotesMatchPrices()
  const toast = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)
  const canPickProducts = canManage && !isQuoteCompleted
  const { getContentLangValue } = useLocalizedValue()
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false)
  const { reset, formState, handleSubmit, getValues, watch, setValue } =
    useForm<QuoteProductsForm>({ defaultValues: { products: [] } })

  useEffect(() => {
    if (!quote) return
    const initProducts = quote.items.map((i) => {
      return mapQuoteItemToProductRow(i)
    })
    reset({ products: deepClone(initProducts) })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quote])

  const mapQuoteItemToProductRow = (item: Item) => {
    return {
      imageUrl: null,
      id: item.product?.productId,
      name: getContentLangValue(item.product?.name),
      code: item.product?.productId,
      productType: ProductType.basic,
      ref: {
        localizedName: item.product?.name,
        id: item.product?.productId,
      },
      price: '',
      mixins: {},
    } as unknown as ProductRow
  }

  const onSubmit = useCallback(
    async (data: QuoteProductsForm) => {
      if (!quote) return
      const { newItems, deletedItems } = diffQuoteItems(
        quote.items,
        data.products
      )

      blockPanel(true)
      try {
        // Inside the `try`: a failed match-prices call gets the same error
        // toast as a failed update (MD priced before it, unhandled).
        const newItemsWithPrices = newItems.length
          ? await getPriceForQuoteItems(quote, newItems)
          : []

        const updateOperations = buildQuoteItemsOperations(
          newItemsWithPrices,
          deletedItems
        )

        await updateQuote(quote.id, updateOperations)
        toast.showToast(t('quotes.toasts.successUpdate'), '', 'success')
        refreshData()
      } catch (e) {
        console.error(e)
        // COP-7125: without a shipping address the match uses the home base or the first
        // ship-to country of the quote's site; with none, nothing is added.
        toast.showToast(
          isNoShipToCountryError(e)
            ? t('quotes.toasts.errorNoShipToCountry')
            : (getApiErrorMessage(e) ?? t('quotes.toasts.errorUpdate')),
          '',
          'error'
        )
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState]
  )

  const removeProduct = (idToRemove: string) => {
    if (isQuoteCompleted) return
    const filteredProducts = getValues('products').filter(
      (product) => product.id !== idToRemove
    )
    setValue('products', filteredProducts, { shouldDirty: true })
  }

  const applySelection = (products: ProductRow[]) => {
    if (isQuoteCompleted) return
    setValue('products', products, { shouldDirty: true })
  }

  const products = watch('products') ?? []
  // COP-7125: saved items without a price are marked "Price on request".
  const unpricedProductIds = (quote?.items ?? [])
    .filter((item) => !item.price)
    .map((item) => item.product.productId)

  return (
    <div className={className}>
      <FallbackCountryNotice quote={quote} className={styles.notice} />
      <SectionBox
        name={t('quotes.tabs.products.selectedItems')}
        actions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!formState.isDirty || !canManage}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              // No rule validates the picked products (MD's Controller had
              // none either), so Save does not wait for `isValid`. With no
              // registered field, react-hook-form 7.91 left it false when the
              // tab opened with the quote loaded: `reset()` dropped the mount
              // validation and nothing validated again.
              disabled={!formState.isDirty || isQuoteCompleted || !canManage}
              onClick={handleSubmit(onSubmit)}
            >
              {t('global.save')}
            </PrimaryButton>
            {canPickProducts && (
              <PrimaryButton
                onClick={() => setIsSelectDialogOpen(true)}
                data-testid="quote-select-products"
              >
                {t('quotes.tabs.products.selectProducts')}
              </PrimaryButton>
            )}
          </div>
        }
      >
        <div className={styles.selected}>
          {products.length > 0 ? (
            <QuotesTabProductsSelected
              products={products}
              removeProduct={removeProduct}
              unpricedProductIds={unpricedProductIds}
            />
          ) : (
            <EmptyContent
              className={styles.empty}
              text={t('quotes.tabs.products.selectedItemsEmpty')}
            />
          )}
        </div>
      </SectionBox>
      {canPickProducts && (
        <QuotesSelectProductsDialog
          visible={isSelectDialogOpen}
          selection={products}
          onApply={applySelection}
          onHide={() => setIsSelectDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default QuotesTabProducts
