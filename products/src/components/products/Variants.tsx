import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import {
  DataTable,
  FilterMatchMode,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Product, ProductType } from '../../models/Category.model'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useProductData } from '../../context/ProductDataProvider'
import { useProductsApi } from '../../hooks/api/products'
import { useUIBlocker } from '../../context/UIBlocker'
import TableActions from '../shared/TableActions'
import { usePermissions } from '../../context/PermissionsProvider'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination from '../../hooks/usePagination'
import { getFirstImageMediaUrl } from '../../helpers/images'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { productDetailPath, productsListPath } from '../../constants/paths'
import styles from './Variants.module.scss'
import { ProductThumbnail } from '../shared/ProductThumbnail'

export const Variants = () => {
  const { product } = useProductData()

  const parentId = useMemo(() => {
    if (product.productType === ProductType.parentVariant && product.id) {
      return product.id
    }
    if (product.productType === ProductType.dynamicVariant && product.id) {
      return product.id
    }
    if (
      product.productType === ProductType.variant &&
      product.parentVariantId
    ) {
      return product.parentVariantId
    }
  }, [product])

  return (
    <div>
      {parentId && <VariantsList variantParentId={parentId}></VariantsList>}
    </div>
  )
}

interface VariantListProps {
  readonly variantParentId: string
}

export const VariantsList = (props: VariantListProps) => {
  const { variantParentId } = props
  const { i18n, t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { contentLanguage } = useConfiguration()
  const { getContentLangValue } = useLocalizedValue()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const { syncPaginatedProducts, deleteProduct } = useProductsApi()
  const {
    paginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
  } = usePagination({ sortField: 'metadata.createdAt' })
  const { product } = useProductData()

  useEffect(() => {
    void loadVariants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantParentId, paginationParams])

  const loadVariants = async () => {
    const params = {
      ...paginationParams,
      filters: {
        ...paginationParams.filters,
        parentVariantId: {
          value: variantParentId,
          matchMode: FilterMatchMode.CONTAINS,
        },
      },
    }
    setLoading(true)
    const { totalCount, data } = await syncPaginatedProducts(params)
    setProducts(data)
    setTotalCount(totalCount)
    setLoading(false)
  }

  const deleteVariant = useCallback(
    async (id: string) => {
      blockPanel(true)
      try {
        await deleteProduct(id)
        blockPanel(false)
        if (product.id === id) {
          navigate(productsListPath())
        } else {
          void loadVariants()
        }
      } catch (e) {
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteProduct]
  )

  const columns: DataTableColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'imageUrl',
        header: t(`products.table.image`),
        field: 'media',
        filter: false,
        sortable: false,
        body: (pr: Product) => {
          const imageUrl = getFirstImageMediaUrl(pr.media)
          return <ProductThumbnail url={imageUrl} />
        },
      },
      {
        columnKey: 'name',
        header: t(`products.table.name`),
        field: `name`,
        filter: true,
        filterField: 'name',
        sortable: true,
        showFilterMenu: false,
        body: (rowData: Product) => getContentLangValue(rowData.name),
      },
      {
        columnKey: 'code',
        header: t(`products.table.code`),
        field: 'code',
        filter: true,
        filterField: 'code',
        sortable: true,
        showFilterMenu: false,
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, contentLanguage])

  const rowActions = (rowData: Product) => (
    <TableActions
      managerPermission={canManage}
      onDelete={() => (rowData.id ? deleteVariant(rowData.id) : undefined)}
      deleteConfirm={{ pluralsPath: 'products', entity: rowData }}
    />
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <>
      <div className={styles.subtitle}>
        {t('products.edit.tab.attributes.title')}
      </div>
      <DataTable
        value={products}
        dataKey="id"
        columns={columns}
        rowActions={rowActions}
        lazy={true}
        loading={loading}
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onRowClick={(p) => {
          if (product.id === p.id || !p.id) return
          const currentPath = `${location.pathname}${location.search}`
          navigate(productDetailPath(p.id), {
            replace: true,
            query: { backTo: currentPath },
          })
        }}
      />
    </>
  )
}
