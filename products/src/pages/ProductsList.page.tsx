import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BsDownload } from 'react-icons/bs'
import { CategoryType, ProductRow, withCategoryScope } from '@emporix/api-calls'
import {
  ALL_PRODUCTS_BROWSER_COLUMNS,
  ConfirmBox,
  Dialog,
  FileUpload,
  PrimaryButton,
  ProductsBrowser,
  SecondaryButton,
  toProductsBrowserCategoryNodes,
  useToast,
  type FileUploadHandlerEvent,
  type ProductsBrowserLabels,
  type ProductsBrowserQuery,
  type ProductsBrowserView,
} from '@emporix/component-library'
import { useProductsApi } from '../hooks/api/products'
import { useCategoryTreeApi } from '../hooks/api/categoryTree'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useUIBlocker } from '../context/UIBlocker'
import HeaderSection from '../components/shared/HeaderSection'
import { ProductType } from '../models/Category.model'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import TableActions from '../components/shared/TableActions'
import TableExtensions from '../components/shared/TableExtensions'
import { usePermissions } from '../context/PermissionsProvider'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import BatchDeleteButton from '../components/shared/BatchDeleteButton'
import { parseColumnProps } from '../models/DisplayMixin'
import { SchemaType } from '../models/Schema.model'
import { EmployeeDomains, VendorDomains } from '../configs/accessControls'
import CreateProductDialog from '../components/products/CreateProductDialog'
import { productCreatePath, productDetailPath } from '../constants/paths'
import { apiPagination } from '../helpers/apiPagination'
import { formatDateWithTime } from '../helpers/date'
import { mapToCsv, saveToCsvFile } from '../helpers/download'
import {
  pageFromSearchParams,
  toProductsListRow,
  visibleProductColumns,
  type ProductsListRow,
} from '../helpers/productsList.helpers'
import styles from './ProductsList.module.scss'

type ProductsActionProps = {
  readonly product: ProductRow
  readonly invalidateProducts: () => void
}

const SUBSCRIPTION_FEATURE_TOGGLE_NAME = 'DCP_PRODUCT_SUBSCRIPTION'
const PRODUCTS_TABLE_NAME = 'products.table'
const PRODUCTS_COLUMN_SETTINGS_KEY = 'ext_products'
const LIST_VIEW: ProductsBrowserView[] = ['list']
const LIST_AND_TREE_VIEWS: ProductsBrowserView[] = ['list', 'tree']
const CSV_HEADERS = ['id', 'name', 'price']

const isDynamicVariant = (product: ProductRow) =>
  String(product.productType).toUpperCase() === ProductType.dynamicVariant

export const ProductsAction = ({
  product,
  invalidateProducts,
}: ProductsActionProps) => {
  const { deleteProduct } = useProductsApi()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const confirmDelete = useCallback(async () => {
    try {
      await deleteProduct(product.id, isDynamicVariant(product))
      invalidateProducts()
    } catch (e) {
      console.error(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  return (
    <TableActions
      managerPermission={canManage}
      onDelete={confirmDelete}
      deleteConfirm={{
        pluralsPath: 'products',
        entity: product.ref,
      }}
      onEdit={() => navigate(productDetailPath(product.id))}
    />
  )
}

const ProductsListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const toast = useToast()
  const {
    deleteProduct,
    fetchAllProducts,
    syncPaginatedProductsRows,
    triggerDynamicVariantRecalculation,
  } = useProductsApi()
  const { getCategoryTrees } = useCategoryTreeApi()
  const { getContentLangValue, getUiLangValue } = useLocalizedValue()
  const { tenant, contentLanguage } = useDashboardContext()
  const { blockPanel } = useUIBlocker()
  const { isToggleValid } = useFeatureToggles()
  const { tableConfigurations, getTableMixinColumns } = useConfiguration()
  const [searchParams, setSearchParams] = useSearchParams()
  const [initialPage] = useState(() => pageFromSearchParams(searchParams))

  const [refreshKey, setRefreshKey] = useState(Date.now())
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const [, setIsImportingProducts] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<ProductsListRow[]>(
    []
  )
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRecalculatingVariants, setIsRecalculatingVariants] = useState(false)
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false)
  // The scope of the last load, for the CSV export. There is none while the
  // tree view waits for a category.
  const [exportQuery, setExportQuery] = useState<ProductsBrowserQuery | null>(
    null
  )
  const loadIdRef = useRef(0)
  const { hasPermission } = usePermissions()
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const isImportEnabled =
    Boolean(import.meta.env.VITE_MRWORKER_DEMO) &&
    Boolean(tenant) &&
    tenant.includes('mrworker')

  const invalidateProducts = useCallback(() => {
    setRefreshKey(Date.now())
  }, [])

  const columnSettings = useMemo(
    () =>
      tableConfigurations.find(
        (config) => config.key === PRODUCTS_COLUMN_SETTINGS_KEY
      )?.columns ?? [],
    [tableConfigurations]
  )
  const columns = useMemo(
    () => visibleProductColumns(columnSettings),
    [columnSettings]
  )
  const extraColumns = useMemo(
    () =>
      getTableMixinColumns(PRODUCTS_COLUMN_SETTINGS_KEY).map((mixin) =>
        parseColumnProps(mixin, getUiLangValue)
      ),
    [getTableMixinColumns, getUiLangValue]
  )
  const withPrices = columns.includes('price')

  const columnHeaders: Record<string, string> = useMemo(
    () => ({
      imageUrl: t('products.table.image'),
      name: t('products.table.name'),
      id: t('products.table.id'),
      code: t('products.table.code'),
      productType: t('products.table.productType'),
      vendorName: t('products.table.vendor'),
      price: t('products.table.price'),
    }),
    [t]
  )

  const labels = useMemo<Partial<ProductsBrowserLabels>>(
    () => ({
      image: columnHeaders.imageUrl,
      name: columnHeaders.name,
      id: columnHeaders.id,
      code: columnHeaders.code,
      productType: columnHeaders.productType,
      vendor: columnHeaders.vendorName,
      price: columnHeaders.price,
      listView: t('products.browser.listView'),
      treeView: t('products.browser.treeView'),
      selectCategory: t('products.browser.selectCategory'),
      noProducts: t('products.browser.noProducts'),
      noCategories: t('products.browser.noCategories'),
      published: t('products.browser.published'),
      unpublished: t('products.browser.unpublished'),
      pageReport: t('global.pagination'),
      anyProductType: t('global.all'),
      productTypes: Object.fromEntries(
        Object.values(ProductType).map((type) => [
          type,
          t(`products.types.${type}`),
        ])
      ),
    }),
    [t, columnHeaders]
  )

  const loadProducts = useCallback(
    async (query: ProductsBrowserQuery) => {
      const loadId = ++loadIdRef.current
      const { data, totalCount } = await syncPaginatedProductsRows(
        apiPagination({
          ...query,
          filters: withCategoryScope(query.filters, query.categoryIds),
        }),
        true,
        withPrices
      )
      if (loadId === loadIdRef.current) {
        setExportQuery(query)
      }
      return {
        values: data.map((row) => toProductsListRow(row, getContentLangValue)),
        totalRecords: totalCount,
      }
    },
    [syncPaginatedProductsRows, withPrices, getContentLangValue]
  )

  const loadCategoryTree = useCallback(
    async () =>
      toProductsBrowserCategoryNodes(
        await getCategoryTrees({ type: CategoryType.STANDARD }),
        contentLanguage
      ),
    [getCategoryTrees, contentLanguage]
  )

  const handleLoadError = useCallback(
    (error: unknown, source: 'products' | 'categories') => {
      console.error(error)
      toast.showError(
        t(
          source === 'categories'
            ? 'products.browser.categoriesLoadError'
            : 'products.table.loadError'
        ),
        ''
      )
    },
    [toast, t]
  )

  const handleScopeChange = useCallback(() => {
    loadIdRef.current++
    setExportQuery(null)
    setSelectedProducts([])
  }, [])

  // Page and rows live in the URL, so going back restores them.
  const handleQueryChange = useCallback(
    (query: ProductsBrowserQuery) => {
      setSearchParams(
        (params) => {
          params.set('page', String(query.currentPage ?? 1))
          params.set('rows', String(query.rows ?? 10))
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const openProduct = useCallback(
    (product: ProductsListRow) => navigate(productDetailPath(product.id)),
    [navigate]
  )

  const renderRowActions = useCallback(
    (product: ProductsListRow) => (
      <ProductsAction
        product={product}
        invalidateProducts={invalidateProducts}
      />
    ),
    [invalidateProducts]
  )

  const exportToCsv = async () => {
    if (!exportQuery) return
    try {
      blockPanel(true)
      const productsToExport = await fetchAllProducts(
        apiPagination({
          currentPage: 1,
          rows: 100,
          sortField: exportQuery.sortField,
          sortOrder: exportQuery.sortOrder,
          filters: withCategoryScope(
            exportQuery.filters,
            exportQuery.categoryIds
          ),
        })
      )
      const data = mapToCsv(CSV_HEADERS, productsToExport, (product) => [
        product.id,
        getContentLangValue(product.ref.localizedName),
        product.price,
      ])
      const scope = exportQuery.categoryIds[0] ?? 'products'
      saveToCsvFile(`${scope}-${formatDateWithTime(new Date())}.csv`, data)
    } catch (error) {
      console.error(error)
      toast.showError(t('products.table.exportError'), '')
    } finally {
      blockPanel(false)
    }
  }

  const confirmBatchDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeletingProducts(true)
      const toDelete = selectedProducts.length
      await Promise.all(
        selectedProducts.map((p: ProductRow) =>
          deleteProduct(p.id, isDynamicVariant(p))
        )
      )
      invalidateProducts()
      setSelectedProducts([])
      toast.showToast(
        t('products.toasts.successDeleteProducts', { count: toDelete }),
        '',
        'success'
      )
      setIsDeleteConfirmOpened(false)
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
      setIsDeletingProducts(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProducts])

  const handleSelectCreateProductType = useCallback(
    (type: ProductType, subscription?: boolean) => {
      if (subscription) {
        navigate(
          productCreatePath(
            `type=${ProductType.parentVariant}&subscription=true`
          )
        )
        return
      }
      navigate(productCreatePath(`type=${type}`))
    },
    [navigate]
  )

  const selectedDynamicVariantIds = useMemo(
    () => selectedProducts.filter(isDynamicVariant).map((p) => p.id),
    [selectedProducts]
  )

  const handleRecalculateDynamicVariants = useCallback(async () => {
    if (selectedDynamicVariantIds.length === 0) return
    try {
      blockPanel(true)
      setIsRecalculatingVariants(true)
      const res = await triggerDynamicVariantRecalculation(
        selectedDynamicVariantIds
      )
      const jobCount = res.jobs?.length ?? 0
      const skipped = res.skippedProductIds?.length ?? 0
      toast.showToast(
        t('products.recalculateVariants.success', { jobCount, skipped }),
        '',
        'success'
      )
      invalidateProducts()
    } catch (e) {
      console.error(e)
      toast.showError(t('products.recalculateVariants.error'), '')
    } finally {
      blockPanel(false)
      setIsRecalculatingVariants(false)
    }
  }, [
    selectedDynamicVariantIds,
    triggerDynamicVariantRecalculation,
    blockPanel,
    toast,
    t,
    invalidateProducts,
  ])

  const handleCSVImport = async (e: FileUploadHandlerEvent) => {
    try {
      blockPanel(true)
      setIsImportingProducts(true)
      setIsImportModalOpen(false)

      // code below is to mock importing behaviour
      await new Promise((resolve) => {
        setTimeout(() => resolve('files are imported now'), 3000)
      })

      toast.showToast(t('products.toasts.successImportProducts'), '', 'success')
      e.options.clear()
      blockPanel(false)
      setIsImportingProducts(false)
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
      setIsImportModalOpen(false)
      setIsImportingProducts(false)
    }
  }

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('products.plural')}
        moduleActions={
          <div className={styles.headerActions}>
            {isImportEnabled && (
              <PrimaryButton
                disabled={!canManage}
                onClick={() => setIsImportModalOpen(true)}
              >
                {t('products.importCSV')}
              </PrimaryButton>
            )}
            <PrimaryButton
              disabled={!canManage}
              onClick={() => setCreateProductModalOpen(true)}
            >
              {t('products.createNew')}
            </PrimaryButton>
          </div>
        }
      />
      <ProductsBrowser<ProductsListRow>
        className={styles.browser}
        loadProducts={loadProducts}
        loadCategoryTree={canViewCategories ? loadCategoryTree : undefined}
        columns={columns}
        extraColumns={extraColumns}
        views={canViewCategories ? LIST_AND_TREE_VIEWS : LIST_VIEW}
        labels={labels}
        selection={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onRowClick={openProduct}
        rowActions={renderRowActions}
        // Names come localized from the loader, so a new content language
        // reloads the page.
        refreshKey={`${refreshKey}:${contentLanguage}`}
        scopeKey={tenant}
        initialPage={initialPage}
        onQueryChange={handleQueryChange}
        onScopeChange={handleScopeChange}
        onLoadError={handleLoadError}
        toolbarStart={
          <>
            <BatchDeleteButton
              className={styles.batchDelete}
              selected={selectedProducts.map((p) => p.ref)}
              onDelete={confirmBatchDelete}
              isDeleting={isDeletingProducts}
              pluralsPath="products"
              disabled={!canManage}
            />
            {selectedDynamicVariantIds.length > 0 && (
              <SecondaryButton
                disabled={!canManage || isRecalculatingVariants}
                onClick={handleRecalculateDynamicVariants}
              >
                {t('products.recalculateVariants.action')}
              </SecondaryButton>
            )}
          </>
        }
        toolbarEnd={
          <div className={styles.extensions}>
            {exportQuery && (
              <SecondaryButton
                size="small"
                iconOnly
                onClick={() => void exportToCsv()}
                aria-label={t('global.download')}
              >
                <BsDownload size={18} />
              </SecondaryButton>
            )}
            <TableExtensions
              tableConfigurationKey={PRODUCTS_COLUMN_SETTINGS_KEY}
              tableColumns={ALL_PRODUCTS_BROWSER_COLUMNS}
              tableColumnHeaders={ALL_PRODUCTS_BROWSER_COLUMNS.map(
                (key) => columnHeaders[key]
              )}
              tableName={PRODUCTS_TABLE_NAME}
              schemaType={SchemaType.PRODUCT}
              managerPermission={canManage}
            />
          </div>
        }
        data-testid="products-browser"
      />
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={confirmBatchDelete}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeletingProducts}
        title={`${t('products.actions.batchDelete.message')} (${
          selectedProducts.length
        })`}
        message={t('global.deleteConfirm.plural.description')}
      />
      <Dialog
        visible={isImportModalOpen}
        onHide={() => {
          setIsImportModalOpen(false)
        }}
        header={t('products.import.header')}
      >
        <FileUpload
          className={styles.importUpload}
          name="csv"
          mode="basic"
          chooseLabel={t('products.import.label')}
          accept=".csv"
          customUpload
          uploadHandler={handleCSVImport}
        />
      </Dialog>
      <CreateProductDialog
        visible={createProductModalOpen}
        onHide={() => setCreateProductModalOpen(false)}
        onSelectType={handleSelectCreateProductType}
        showSubscription={isToggleValid(SUBSCRIPTION_FEATURE_TOGGLE_NAME)}
      />
    </div>
  )
}

export default ProductsListPage
