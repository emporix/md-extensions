import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProductRow, withCategoryScope } from '@emporix/api-calls'
import {
  Dialog,
  PrimaryButton,
  ProductsBrowser,
  toProductsBrowserCategoryNodes,
  useToast,
  type ProductsBrowserColumnKey,
  type ProductsBrowserLabels,
  type ProductsBrowserQuery,
  type ProductsBrowserView,
} from '@emporix/component-library'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useProductsApi } from '../../hooks/api/products'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { EmployeeDomains } from '../../configs/accessControls'
import { apiPagination } from '../../helpers/apiPagination'
import { getApiErrorDetails } from '../../helpers/api'
import {
  hasSameIds,
  toQuoteProductRow,
} from '../../helpers/productsBrowser.helpers'
import styles from './QuotesSelectProductsDialog.module.scss'

/** MD `PRODUCT_PICKER_COLUMNS`. */
const PICKER_COLUMNS: ProductsBrowserColumnKey[] = ['name', 'id', 'code']
const PICKER_VIEWS: ProductsBrowserView[] = ['list', 'tree']

type QuotesSelectProductsDialogProps = {
  readonly visible: boolean
  /** The products of the quote form; the dialog starts from them. */
  readonly selection: ProductRow[]
  readonly onApply: (products: ProductRow[]) => void
  readonly onHide: () => void
}

/**
 * The products picker of the Products tab (list or category tree, the tree
 * only with Categories Viewer). It works on a draft of the selection: Apply
 * hands the draft over, closing the dialog drops it.
 */
const QuotesSelectProductsDialog = ({
  visible,
  selection,
  onApply,
  onHide,
}: QuotesSelectProductsDialogProps) => {
  const { t } = useTranslation()
  const toast = useToast()
  const { hasPermission } = usePermissions()
  // Like MD, the tree is not requested without access to categories.
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { tenant } = useDashboardContext()
  const { syncPaginatedProducts } = useProductsApi()
  const { getCategoryTrees } = useCategoriesApi()
  const [draft, setDraft] = useState<ProductRow[]>(selection)

  useEffect(() => {
    if (visible) {
      setDraft(selection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draft only when the dialog opens
  }, [visible])

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
        toast.showError(t('categories.title'), getApiErrorDetails(error))
        return
      }
      toast.showError(t('products.table.loadError'), getApiErrorDetails(error))
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

  const applySelection = () => {
    onApply(draft)
    onHide()
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      className={styles.dialog}
      // Only the rows of the browser scroll; the dialog keeps its height.
      fixedHeight
      header={t('quotes.tabs.products.selectProducts')}
      footer={
        <div className={styles.footer}>
          <PrimaryButton
            disabled={hasSameIds(draft, selection)}
            onClick={applySelection}
            data-testid="quote-apply-products"
          >
            {t('quotes.tabs.products.applySelection')}
          </PrimaryButton>
        </div>
      }
      data-testid="quote-select-products-dialog"
    >
      <ProductsBrowser<ProductRow>
        fillHeight
        loadProducts={loadProducts}
        loadCategoryTree={canViewCategories ? loadCategoryTree : undefined}
        columns={PICKER_COLUMNS}
        views={PICKER_VIEWS}
        labels={labels}
        selection={draft}
        onSelectionChange={setDraft}
        scopeKey={tenant}
        // Names come localized from the loader, so a new content
        // language reloads the page.
        refreshKey={contentLanguage}
        onLoadError={handleLoadError}
        data-testid="quote-products-browser"
      />
    </Dialog>
  )
}

export default QuotesSelectProductsDialog
