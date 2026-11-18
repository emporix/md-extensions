import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { ProductRow, withCategoryScope } from '@emporix/api-calls'
import {
  PrimaryButton,
  ProductsBrowser,
  SecondaryButton,
  SectionBox,
  toProductsBrowserCategoryNodes,
  useToast,
  type ProductsBrowserColumnKey,
  type ProductsBrowserLabels,
  type ProductsBrowserQuery,
  type ProductsBrowserView,
} from '@emporix/component-library'
import EmptyContent from '../shared/EmptyContent'
import QuotesTabProductsSelected from './QuotesTabProductsSelected'
import { useQuoteData } from '../../context/Quote.provider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useProductsApi } from '../../hooks/api/products'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useQuotesMatchPrices } from '../../hooks/useQuotesMatchPrices'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Item } from '../../models/Quotes.model'
import { ProductType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { deepClone } from '../../helpers/utils'
import { apiPagination } from '../../helpers/apiPagination'
import { toQuoteProductRow } from '../../helpers/productsBrowser.helpers'
import {
  buildQuoteItemsOperations,
  diffQuoteItems,
} from '../../helpers/quoteItems.helpers'
import { getApiErrorMessage } from '../../helpers/api'
import styles from './QuotesTabProducts.module.scss'

/** MD `PRODUCT_PICKER_COLUMNS`. */
const PICKER_COLUMNS: ProductsBrowserColumnKey[] = ['name', 'id', 'code']
const PICKER_VIEWS: ProductsBrowserView[] = ['list', 'tree']

export interface QuoteProductsForm {
  products: ProductRow[]
}

/**
 * MD `QuotesTabProducts`: the picked products and a products picker (list or
 * category tree, the tree only with Categories Viewer). Save adds the new
 * lines priced by match-prices and removes the dropped ones.
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
  // Like MD, the tree is not requested without access to categories.
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { tenant } = useDashboardContext()
  const { syncPaginatedProducts } = useProductsApi()
  const { getCategoryTrees } = useCategoriesApi()
  const {
    reset,
    control,
    formState,
    handleSubmit,
    getValues,
    watch,
    setValue,
  } = useForm<QuoteProductsForm>({ defaultValues: { products: [] } })

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
    [formState]
  )

  const removeProduct = (idToRemove: string) => {
    if (isQuoteCompleted) return
    const filteredProducts = getValues('products').filter(
      (product) => product.id !== idToRemove
    )
    setValue('products', filteredProducts, { shouldDirty: true })
  }

  // MD `syncPaginatedProductsRows` without prices (no price column).
  const loadProducts = useCallback(
    async (query: ProductsBrowserQuery) => {
      const { data, totalCount } = await syncPaginatedProducts(
        apiPagination({
          ...query,
          filters: withCategoryScope(query.filters, query.categoryIds),
        })
      )
      if (data.length === 0) {
        return { values: [], totalRecords: 0 }
      }
      return {
        values: data.map((product) =>
          toQuoteProductRow(product, getContentLangValue)
        ),
        totalRecords: totalCount,
      }
    },
    [syncPaginatedProducts, getContentLangValue]
  )

  const loadCategoryTree = useCallback(
    async () =>
      toProductsBrowserCategoryNodes(await getCategoryTrees(), contentLanguage),
    [getCategoryTrees, contentLanguage]
  )

  // MD: the products table toasts its load error, the category tree titles
  // its error with the categories title.
  const handleLoadError = useCallback(
    (error: unknown, source: 'products' | 'categories') => {
      console.error(error)
      if (source === 'categories') {
        toast.showError(t('categories.title'), '')
        return
      }
      toast.showToast(t('products.table.loadError'), '', 'error')
    },
    [toast, t]
  )

  const labels: Partial<ProductsBrowserLabels> = useMemo(
    () => ({
      name: t('products.table.name'),
      id: t('products.table.id'),
      code: t('products.table.code'),
      listView: t('products.browser.listView'),
      treeView: t('products.browser.treeView'),
      selectCategory: t('products.table.selectCategory'),
      noProducts: t('global.noDataFound'),
      noCategories: canViewCategories
        ? t('products.browser.noCategories')
        : t('global.noPermissions'),
      published: t('products.browser.published'),
      unpublished: t('products.browser.unpublished'),
      pageReport: t('global.pagination'),
      anyProductType: t('global.all'),
    }),
    [t, canViewCategories]
  )

  return (
    <div className={className}>
      <SectionBox
        className={styles.selectedSection}
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
        }
      >
        {watch('products')?.length > 0 ? (
          <QuotesTabProductsSelected
            products={getValues('products')}
            removeProduct={removeProduct}
          />
        ) : (
          <EmptyContent
            className={styles.empty}
            text={t('quotes.tabs.products.selectedItemsEmpty')}
          />
        )}
      </SectionBox>
      {!isQuoteCompleted && canManage && (
        <Controller
          name="products"
          control={control}
          render={({ field }) => (
            <ProductsBrowser<ProductRow>
              loadProducts={loadProducts}
              loadCategoryTree={
                canViewCategories ? loadCategoryTree : undefined
              }
              columns={PICKER_COLUMNS}
              views={PICKER_VIEWS}
              labels={labels}
              selection={field.value}
              onSelectionChange={(value) => {
                if (isQuoteCompleted) return
                field.onChange(value)
              }}
              scopeKey={tenant}
              // Names come localized from the loader, so a new content
              // language reloads the page.
              refreshKey={contentLanguage}
              onLoadError={handleLoadError}
              data-testid="quote-products-browser"
            />
          )}
        />
      )}
    </div>
  )
}

export default QuotesTabProducts
