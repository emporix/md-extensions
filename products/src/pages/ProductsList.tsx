import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ProductRow } from '../api/categories'
import { useTranslation } from 'react-i18next'
import { useProductsApi } from '../api/products'
import usePagination from '../hooks/usePagination'
import ConfirmBox from '../components/shared/ConfirmBox'
import { useToast } from '../context/ToastProvider'
import './ProductsList.scss'
import { useUIBlocker } from '../context/UIBlcoker'
import ViewSwitch, { ListType } from '../components/products/ViewSwitch'
import CategoriesProductsTable from '../components/products/CategoriesProductsTable'
import ProductsTable, {
  TABLE_NAME_CONFIG_KEY,
} from '../components/products/ProductsTable'
import HeaderSection from '../components/shared/HeaderSection'
import { SplitButton } from 'primereact/splitbutton'
import { ProductType } from '../models/Category'
import useCustomNavigate from '../hooks/useCustomNavigate.tsx'
import { Dialog } from 'primereact/dialog'
import TableActions from '../components/shared/TableActions'
import { useConfiguration } from '../context/ConfigurationProvider'
import BatchDeleteButton from '../components/shared/BatchDeleteButton'
import { DisplayMixin } from '../models/DisplayMixin.ts'
import { useDashboardContext } from '../context/Dashboard.context.tsx'
import { DataTable } from 'primereact/datatable'
import { FileUpload } from 'primereact/fileupload'

interface ProductsActionProps {
  productId: string
  invalidateProducts: () => void
}

export const ProductsAction = ({
  productId,
  invalidateProducts,
}: ProductsActionProps) => {
  const { t } = useTranslation()
  const { deleteProduct } = useProductsApi()
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const { navigate } = useCustomNavigate()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const deleteCall = () => {
    setIsDeleteConfirmOpened(true)
  }

  const confirmBatchDelete = useCallback(async () => {
    try {
      setIsDeletingProduct(true)
      await deleteProduct(productId)
      invalidateProducts()
      setIsDeleteConfirmOpened(false)
    } finally {
      setIsDeletingProduct(false)
    }
  }, [productId])

  return (
    <div className="flex">
      <TableActions
        managerPermission={canBeManaged}
        onDelete={deleteCall}
        onEdit={() => navigate(`/products/${productId}`)}
      />
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={confirmBatchDelete}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeletingProduct}
        title={t('products.actions.delete.title')}
      />
    </div>
  )
}

export default function ProductsList() {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductRow[]>([])
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null
  )
  const toast = useToast()
  const dataTable = useRef<DataTable>(null)
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const { deleteProducts } = useProductsApi()
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const [, setIsImportingProducts] = useState(false)
  const [visibleColumns, setVisibleColumnCell] = useState<string[]>([])
  const { blockPanel } = useUIBlocker()
  const [listType, setListType] = useState<ListType>('list')
  const paginationProducts = usePagination()
  const paginationCategoriesProducts = usePagination()
  const { resetPagination: resetPaginationProducts } = paginationProducts
  const { resetPagination: resetPaginationCategoriesProducts } =
    paginationCategoriesProducts
  const { tableConfigurations, fetchVisibleColumns, getTableMixinColumns } =
    useConfiguration()
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )

  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const canViewCategories = permissions?.categories?.viewer

  useEffect(() => {
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    setVisibleColumnCell(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY))
  }, [tableConfigurations])

  const confirmBatchDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeletingProducts(true)
      const toDelete = selectedProducts.length
      await deleteProducts(
        selectedProducts.map((product: ProductRow) => product.id)
      )
      invalidateProducts()
      setSelectedProducts([])
      toast.showToast(`${toDelete} product(s) deleted`, '', 'success')
      setIsDeleteConfirmOpened(false)
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
      setIsDeletingProducts(false)
    }
  }, [selectedProducts])

  useEffect(() => {
    resetPaginationProducts()
    resetPaginationCategoriesProducts()
    setSelectedProducts([])
    syncTableConfig()
  }, [currentCategoryId, listType, tableConfigurations])

  const invalidateProducts = () => {
    setRefreshKey(Date.now())
  }

  const syncTableConfig = () => {
    setVisibleColumnCell(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY))
  }

  const createModel = useMemo(() => {
    return [
      {
        label: 'Basic',
        command: () => {
          navigate(`/products/add?type=${ProductType.basic}`)
        },
      },
      {
        label: 'Bundle',
        command: () => {
          navigate(`/products/add?type=${ProductType.bundle}`)
        },
      },
      {
        label: 'Product w/ variants',
        command: () => {
          navigate(`/products/add?type=${ProductType.parentVariant}`)
        },
      },
    ]
  }, [])

  const handleCSVImport = async (e: any) => {
    try {
      blockPanel(true)
      setIsImportingProducts(true)
      setIsImportModalOpen(false)

      // code below is to mock importing behaviour
      await new Promise((resolve) => {
        setTimeout(() => resolve('files are imported now'), 3000)
      })

      toast.showToast('Products IMPORTED', '', 'success')
      e.clear()
      blockPanel(false)
      setIsImportingProducts(false)
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
      setIsImportModalOpen(false)
      setIsImportingProducts(false)
    }
  }

  return (
    <div className="module products">
      <HeaderSection
        title={t('products.title')}
        moduleActions={
          <SplitButton
            disabled={!canBeManaged}
            className={canBeManaged ? '' : 'p-button-secondary'}
            label={t('products.createNew')}
            onClick={() => navigate(`/products/add?type=${ProductType.basic}`)}
            model={createModel}
          />
        }
      />
      <div className="col-12 flex justify-content-between align-items-center mb-4">
        <div className="flex">
          <ViewSwitch
            disabled={!canViewCategories}
            value={listType}
            onChange={setListType}
          />
          <BatchDeleteButton
            className="ml-4"
            selected={selectedProducts}
            onDelete={confirmBatchDelete}
            isDeleting={isDeletingProducts}
            entityKey="products"
            disabled={!canBeManaged}
          />
        </div>
        <div id="table-extensions"></div>
      </div>
      {listType === 'tree' ? (
        <CategoriesProductsTable
          dataTable={dataTable}
          categoryId={currentCategoryId}
          setCategoryId={setCurrentCategoryId}
          totalCount={paginationCategoriesProducts.totalCount}
          paginationParams={paginationCategoriesProducts.paginationParams}
          onPageCallback={paginationCategoriesProducts.onPageCallback}
          onSortCallback={paginationCategoriesProducts.onSortCallback}
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
        />
      ) : (
        <ProductsTable
          dataTable={dataTable}
          invalidateProducts={invalidateProducts}
          paginationParams={paginationProducts.paginationParams}
          onPageCallback={paginationProducts.onPageCallback}
          setTotalCount={paginationProducts.setTotalCount}
          totalCount={paginationProducts.totalCount}
          setPaginationParams={paginationProducts.setPaginationParams}
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
          showTableExtensions={true}
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
      />
      <Dialog
        visible={isImportModalOpen}
        onHide={() => {
          setIsImportModalOpen(false)
        }}
        header={t('products.import.header')}
      >
        <FileUpload
          className="py-2"
          name="csv"
          mode="basic"
          chooseLabel={t('products.import.label')}
          accept={'.csv'}
          customUpload
          uploadHandler={(e) => handleCSVImport(e)}
        />
      </Dialog>
    </div>
  )
}
