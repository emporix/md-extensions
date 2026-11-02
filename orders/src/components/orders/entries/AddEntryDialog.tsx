import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chip,
  Dialog,
  PrimaryButton,
  ProductsBrowser,
  QuantityStepper,
  useToast,
  type DataTableColumnProps,
  type ProductsBrowserColumnKey,
  type ProductsBrowserLabels,
  type ProductsBrowserQuery,
  type ProductsBrowserView,
} from '@emporix/component-library'
import { useProductsApi } from '../../../hooks/api/products'
import { useCategoriesApi } from '../../../hooks/api/categories'
import { useOrdersApi } from '../../../hooks/api/orders'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { useDashboardContext } from '../../../context/Dashboard.context'
import { usePermissions } from '../../../context/PermissionsProvider'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { EmployeeDomains } from '../../../configs/accessControls'
import { apiPagination } from '../../../helpers/apiPagination'
import { getApiErrorDetails, getApiErrorMessage } from '../../../helpers/api'
import { addNewEntriesFromProducts } from '../../../helpers/orders'
import {
  toCategoryNodes,
  toProductRow,
  withCategoryScope,
  type AddEntryProductRow,
} from '../../../helpers/productsBrowser.helpers'
import type { Product } from '../../../models/Product.model'
import styles from './AddEntryDialog.module.scss'

const COLUMNS: ProductsBrowserColumnKey[] = [
  'imageUrl',
  'name',
  'id',
  'code',
  'productType',
]
const VIEWS: ProductsBrowserView[] = ['list', 'tree']

type AddEntryDialogProps = {
  readonly onClose: () => void
  readonly visible: boolean
}

const AddEntryDialog = ({ onClose, visible }: AddEntryDialogProps) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { syncPaginatedProducts } = useProductsApi()
  const { getCategoryTrees } = useCategoriesApi()
  const { addEntries } = useOrdersApi()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { tenant } = useDashboardContext()
  const { hasPermission } = usePermissions()
  const { order, newEntries, updateOrder } = useOrderData()
  const [isSaving, setIsSaving] = useState(false)
  // Like MD, the tree is not requested without access to categories.
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const [productsToAdd, setProductsToAdd] = useState<Product[]>([])

  const loadProducts = useCallback(
    async (query: ProductsBrowserQuery) => {
      const { data, totalCount } = await syncPaginatedProducts(
        apiPagination({
          ...query,
          filters: withCategoryScope(query.filters, query.categoryIds),
        })
      )
      return {
        values: data.map((product) =>
          toProductRow(product, getContentLangValue)
        ),
        totalRecords: totalCount,
      }
    },
    [syncPaginatedProducts, getContentLangValue]
  )

  const loadCategoryTree = useCallback(
    async () => toCategoryNodes(await getCategoryTrees(), contentLanguage),
    [getCategoryTrees, contentLanguage]
  )

  const handleLoadError = useCallback(
    (e: unknown, source: 'products' | 'categories') =>
      showError(
        t(
          source === 'categories'
            ? 'orders.toasts.errorFetchCategories'
            : 'orders.toasts.errorFetchProducts'
        ),
        getApiErrorDetails(e)
      ),
    [showError, t]
  )

  const labels: Partial<ProductsBrowserLabels> = useMemo(
    () => ({
      image: '',
      name: t('orders.entry.actions.addProduct.table.name'),
      id: t('orders.entry.actions.addProduct.table.id'),
      code: t('orders.entry.actions.addProduct.table.code'),
      productType: t('orders.entry.actions.addProduct.table.productType'),
      listView: t('orders.entry.actions.addProduct.browser.listView'),
      treeView: t('orders.entry.actions.addProduct.browser.treeView'),
      selectCategory: t(
        'orders.entry.actions.addProduct.browser.selectCategory'
      ),
      noProducts: t('orders.entry.actions.addProduct.browser.noProducts'),
      noCategories: canViewCategories
        ? t('orders.entry.actions.addProduct.browser.noCategories')
        : t('global.noPermissions'),
      published: t('orders.entry.actions.addProduct.browser.published'),
      unpublished: t('orders.entry.actions.addProduct.browser.unpublished'),
      pageReport: t('global.pagination'),
      anyProductType: t('global.all'),
      productTypes: {
        BASIC: t('orders.entry.actions.addProduct.productTypes.BASIC'),
        BUNDLE: t('orders.entry.actions.addProduct.productTypes.BUNDLE'),
        VARIANT: t('orders.entry.actions.addProduct.productTypes.VARIANT'),
        PARENT_VARIANT: t(
          'orders.entry.actions.addProduct.productTypes.PARENT_VARIANT'
        ),
        DYNAMIC_VARIANT: t(
          'orders.entry.actions.addProduct.productTypes.DYNAMIC_VARIANT'
        ),
      },
    }),
    [t, canViewCategories]
  )

  const handleClose = () => {
    setProductsToAdd([])
    onClose()
  }

  // A finished save closes the dialog, so closing it during the save would let
  // that close a dialog opened again in the meantime.
  const handleHide = () => {
    if (!isSaving) {
      handleClose()
    }
  }

  const onSubmit = async () => {
    if (!order) return
    try {
      setIsSaving(true)
      const updatedOrder = await addNewEntriesFromProducts(
        order.id,
        newEntries,
        productsToAdd,
        addEntries
      )
      updateOrder(updatedOrder)
      handleClose()
    } catch (e: unknown) {
      showError(
        t('orders.toasts.errorEntriesUpdate'),
        getApiErrorDetails(e) ?? getApiErrorMessage(e) ?? String(e)
      )
    } finally {
      setIsSaving(false)
    }
  }

  const setQuantity = useCallback((product: Product, value: number) => {
    setProductsToAdd((prev) => {
      if (value === 0) return prev.filter((p) => p.id !== product.id)
      const exists = prev.some((p) => p.id === product.id)
      return exists
        ? prev.map((p) => (p.id === product.id ? { ...p, quantity: value } : p))
        : [...prev, { ...product, quantity: value }]
    })
  }, [])

  const extraColumns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'action',
        field: 'action',
        header: t('orders.entry.actions.addProduct.table.action'),
        // The stepper stays in view when the table is wider than the dialog.
        frozen: true,
        alignFrozen: 'right',
        body: (row: AddEntryProductRow) => (
          <QuantityStepper
            min={0}
            value={productsToAdd.find((p) => p.id === row.id)?.quantity ?? 0}
            onChange={(e) => setQuantity(row.product, e.value ?? 0)}
            // The save sends the picks of the click; later changes would be lost.
            disabled={isSaving}
          />
        ),
      },
    ],
    [t, productsToAdd, setQuantity, isSaving]
  )

  return (
    <Dialog
      className={styles.dialog}
      visible={visible}
      style={{ width: '90vw', maxHeight: '90vh' }}
      onHide={handleHide}
      closable={!isSaving}
      header={t('orders.entry.actions.addProduct.dialog.title')}
      footer={
        <div className={styles.footer}>
          <PrimaryButton
            disabled={productsToAdd.length === 0}
            loading={isSaving}
            onClick={onSubmit}
          >
            {t('orders.entry.actions.addProduct.dialog.title')}
          </PrimaryButton>
        </div>
      }
    >
      {productsToAdd.length > 0 ? (
        <div className={styles.chips}>
          {productsToAdd.map((p) => {
            const label = `${p.quantity}x ${getContentLangValue(p.name)}`
            return (
              <Chip
                key={p.id}
                className={styles.chip}
                label={label}
                title={label}
                removable={!isSaving}
                removeAriaLabel={t('global.remove')}
                onRemove={() =>
                  setProductsToAdd((prev) =>
                    prev.filter((item) => item.id !== p.id)
                  )
                }
              />
            )
          })}
        </div>
      ) : (
        <div className={styles.chipsPlaceholder} />
      )}
      <ProductsBrowser<AddEntryProductRow>
        className={styles.browser}
        loadProducts={loadProducts}
        loadCategoryTree={canViewCategories ? loadCategoryTree : undefined}
        columns={COLUMNS}
        extraColumns={extraColumns}
        views={VIEWS}
        labels={labels}
        scopeKey={tenant}
        // Names come localized from the loader, so a new content language
        // reloads the page.
        refreshKey={contentLanguage}
        onLoadError={handleLoadError}
        data-testid="add-entry-products-browser"
      />
    </Dialog>
  )
}

export default AddEntryDialog
