import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProductRow } from '@emporix/api-calls'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  Dialog,
  FileUpload,
  PrimaryButton,
  SecondaryButton,
  useToast,
  type FileUploadHandlerEvent,
} from '@emporix/component-library'
import { useProductsApi } from '../hooks/api/products'
import usePagination from '../hooks/usePagination'
import { useUIBlocker } from '../context/UIBlocker'
import ViewSwitch, { ListType } from '../components/products/ViewSwitch'
import CategoriesProductsTable from '../components/products/CategoriesProductsTable'
import ProductsTable, {
  TABLE_NAME_CONFIG_KEY,
} from '../components/products/ProductsTable'
import HeaderSection from '../components/shared/HeaderSection'
import { ProductType } from '../models/Category.model'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import TableActions from '../components/shared/TableActions'
import { usePermissions } from '../context/PermissionsProvider'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import BatchDeleteButton from '../components/shared/BatchDeleteButton'
import { DisplayMixin } from '../models/DisplayMixin'
import { EmployeeDomains, VendorDomains } from '../configs/accessControls'
import CreateProductDialog from '../components/products/CreateProductDialog'
import { productCreatePath, productDetailPath } from '../constants/paths'
import styles from './ProductsList.module.scss'

type ProductsActionProps = {
  readonly product: ProductRow
  readonly invalidateProducts: () => void
}

const SUBSCRIPTION_FEATURE_TOGGLE_NAME = 'DCP_PRODUCT_SUBSCRIPTION'

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
  const { deleteProduct, triggerDynamicVariantRecalculation } = useProductsApi()
  const { tenant } = useDashboardContext()
  const { blockPanel } = useUIBlocker()
  const { isToggleValid } = useFeatureToggles()
  const paginationProducts = usePagination()
  const paginationCategoriesProducts = usePagination()
  const { resetPagination: resetPaginationProducts } = paginationProducts
  const { resetPagination: resetPaginationCategoriesProducts } =
    paginationCategoriesProducts
  const { tableConfigurations, fetchVisibleColumns, getTableMixinColumns } =
    useConfiguration()
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )

  // MD portals the column settings into `#table-extensions`; a ref-backed
  // slot does the same without a document-global id.
  const [extensionsSlot, setExtensionsSlot] = useState<HTMLDivElement | null>(
    null
  )
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const [, setIsImportingProducts] = useState(false)
  const [visibleColumns, setVisibleColumnCell] = useState<string[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductRow[]>([])
  const [listType, setListType] = useState<ListType>('list')
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRecalculatingVariants, setIsRecalculatingVariants] = useState(false)
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false)
  const { hasPermission } = usePermissions()
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null
  )

  const isImportEnabled =
    Boolean(import.meta.env.VITE_MRWORKER_DEMO) &&
    Boolean(tenant) &&
    tenant.includes('mrworker')

  const invalidateProducts = useCallback(() => {
    setRefreshKey(Date.now())
  }, [])

  useEffect(() => {
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    setVisibleColumnCell(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableConfigurations])

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

  useEffect(() => {
    resetPaginationProducts()
    resetPaginationCategoriesProducts()
    setSelectedProducts([])
    setVisibleColumnCell(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategoryId, listType, tableConfigurations])

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
      <div className={styles.toolbar}>
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
        <ViewSwitch
          disabled={!canViewCategories}
          value={listType}
          onChange={setListType}
        />
        <div ref={setExtensionsSlot} className={styles.extensionsSlot} />
      </div>
      {listType === 'tree' ? (
        <CategoriesProductsTable
          categoryId={currentCategoryId}
          setCategoryId={setCurrentCategoryId}
          totalCount={paginationCategoriesProducts.totalCount}
          paginationParams={paginationCategoriesProducts.paginationParams}
          onPageCallback={paginationCategoriesProducts.onPageCallback}
          setTotalCount={paginationCategoriesProducts.setTotalCount}
          setPaginationParams={paginationCategoriesProducts.setPaginationParams}
          setFilters={paginationCategoriesProducts.setFilters}
          refreshKey={refreshKey}
          products={products}
          setProducts={setProducts}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          clickToEdit={true}
          visibleColumns={visibleColumns}
          visibleMixins={visibleMixins}
          invalidateProducts={invalidateProducts}
          extensionsContainer={extensionsSlot}
        />
      ) : (
        <ProductsTable
          className={styles.fullWidth}
          invalidateProducts={invalidateProducts}
          paginationParams={paginationProducts.paginationParams}
          onPageCallback={paginationProducts.onPageCallback}
          setTotalCount={paginationProducts.setTotalCount}
          totalCount={paginationProducts.totalCount}
          onFilterCallback={paginationProducts.onFilterCallback}
          onSortCallback={paginationProducts.onSortCallback}
          setFilters={paginationProducts.setFilters}
          refreshKey={refreshKey}
          products={products}
          setProducts={setProducts}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          visibleColumns={visibleColumns}
          visibleMixins={visibleMixins}
          clickToEdit={true}
          extensionsContainer={extensionsSlot}
        />
      )}
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
        message={null}
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
