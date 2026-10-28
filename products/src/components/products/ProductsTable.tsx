import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ProductRow } from '@emporix/api-calls'
import {
  DataTable,
  Dropdown,
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTablePageEvent,
  type DataTablePaginationState,
  type DataTableSortEvent,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { useProductsApi } from '../../hooks/api/products'
import { ProductsAction } from '../../pages/ProductsList.page'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useConfiguration } from '../../context/ConfigurationProvider'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { ProductType } from '../../models/Category.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { numericColumn } from '../shared/NumericColumn'
import { DisplayMixin, parseColumnProps } from '../../models/DisplayMixin'
import TableExtensions from '../shared/TableExtensions'
import { SchemaType } from '../../models/Schema.model'
import { usePermissions } from '../../context/PermissionsProvider'
import { StylableProps } from '../../helpers/props'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { productDetailPath } from '../../constants/paths'
import styles from './ProductsTable.module.scss'
import { ProductThumbnail } from '../shared/ProductThumbnail'

export const TABLE_NAME = 'products.table'
export const TABLE_NAME_CONFIG_KEY = 'ext_products'

const ALL = ''

type ProductsTableProps = StylableProps & {
  readonly paginationParams: Partial<PaginationProps>
  readonly onPageCallback: (event: DataTablePageEvent) => void
  readonly onSortCallback: (event: DataTableSortEvent) => void
  readonly onFilterCallback: (event: DataTableFilterEvent) => void
  readonly refreshKey: number
  readonly invalidateProducts: () => void
  readonly products: ProductRow[]
  readonly setTotalCount: (num: number) => unknown
  readonly totalCount: number
  readonly setProducts: (products: ProductRow[]) => unknown
  readonly selectedProducts: ProductRow[]
  readonly setSelectedProducts: (products: ProductRow[]) => unknown
  readonly visibleColumns: string[]
  readonly clickToEdit: boolean
  readonly visibleMixins: DisplayMixin[]
  readonly setFilters: (columns: DataTableColumnProps[]) => void
  /** Toolbar slot the column settings are portalled into (MD `#table-extensions`). */
  readonly extensionsContainer?: HTMLElement | null
}

const ProductsTable = ({
  className = '',
  paginationParams,
  onSortCallback,
  onPageCallback,
  onFilterCallback,
  refreshKey,
  invalidateProducts,
  setTotalCount,
  totalCount,
  products,
  setProducts,
  selectedProducts,
  setSelectedProducts,
  visibleColumns,
  clickToEdit = true,
  visibleMixins,
  setFilters,
  extensionsContainer,
}: ProductsTableProps) => {
  const { syncPaginatedProductsRows } = useProductsApi()
  const [productsLoading, setProductsLoading] = useState(false)
  const { getContentLangValue, getUiLangValue } = useLocalizedValue()
  const { contentLanguage } = useConfiguration()
  const { tenant } = useDashboardContext()
  const { t, i18n } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  // COP-4282: Temporary solution to optimize requests calls amount
  useEffect(() => {
    setTimeout(() => {
      isReadyToFilterRef.current = true
    }, 1000)
  }, [])

  const isFirstLoadRef = useRef(true)
  const isReadyToFilterRef = useRef(false)
  const prevPaginationParamsRef = useRef(paginationParams)
  const prevRefreshKeyRef = useRef(refreshKey)
  const prevTenantRef = useRef(tenant)
  const prevFiltersKeyRef = useRef<DataTableFilterMeta>()

  const optimizeRequest = useCallback(
    (runner: (shouldUpdateCount: boolean) => Promise<void>) => {
      const prev = prevPaginationParamsRef.current
      const next = paginationParams
      const comparedFilters =
        JSON.stringify(prevFiltersKeyRef.current) ===
        JSON.stringify(next.filters)

      // compute changes
      const pageChanged = prev?.currentPage !== next?.currentPage
      const pageSizeChanged = prev?.rows !== next?.rows
      const sortFieldChanged = prev?.sortField !== next?.sortField
      const sortOrderChanged = prev?.sortOrder !== next?.sortOrder
      const refreshChanged = prevRefreshKeyRef.current !== refreshKey
      const tenantChanged = prevTenantRef.current !== tenant
      const filtersChanged = isReadyToFilterRef.current && !comparedFilters

      const nothingChanged =
        !filtersChanged &&
        !pageChanged &&
        !pageSizeChanged &&
        !sortFieldChanged &&
        !sortOrderChanged &&
        !refreshChanged &&
        !tenantChanged

      const shouldUpdateCount =
        isFirstLoadRef.current ||
        tenantChanged ||
        refreshChanged ||
        filtersChanged

      if (!isFirstLoadRef.current && nothingChanged) {
        return
      }

      isFirstLoadRef.current = false
      prevPaginationParamsRef.current = paginationParams
      prevRefreshKeyRef.current = refreshKey
      prevTenantRef.current = tenant
      prevFiltersKeyRef.current = next.filters

      void runner(shouldUpdateCount)
    },
    [paginationParams, refreshKey, tenant]
  )
  // end of COP-4282 --------------------------------------------

  useEffect(() => {
    optimizeRequest(async (shouldUpdateCount: boolean) => {
      try {
        setProductsLoading(true)
        const { totalCount: newCount, data } = await syncPaginatedProductsRows(
          paginationParams,
          shouldUpdateCount
        )
        if (shouldUpdateCount) setTotalCount(newCount)
        setProducts(data)
      } finally {
        setProductsLoading(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    optimizeRequest,
    paginationParams?.currentPage,
    paginationParams?.rows,
    paginationParams?.sortField,
    paginationParams?.sortOrder,
  ])

  const getNameCell = useCallback(
    (rowData: ProductRow) => {
      return getContentLangValue(rowData.ref.localizedName)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentLanguage]
  )

  const productTypesDropdownOptions = useMemo(
    () => [
      // CL Dropdown has no showClear; an explicit "All" clears the filter.
      { label: t('global.all'), value: ALL },
      ...Object.values(ProductType).map((type) => ({
        value: type as string,
        label: t(`products.types.${type}`),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  )

  const typeFilterElement = useCallback(
    (options: DataTableColumnFilterElementOptions) => (
      <Dropdown
        data-testid="dropdown-filter"
        className={styles.typeFilter}
        value={(options.value as string) ?? ALL}
        options={productTypesDropdownOptions}
        onChange={(e) =>
          options.filterApplyCallback(e.value || undefined, options.index)
        }
      />
    ),
    [productTypesDropdownOptions]
  )

  const visibleMixinsKey = JSON.stringify(visibleMixins)

  const columns = useMemo(() => {
    const baseColumns: DataTableColumnProps[] = [
      {
        columnKey: 'imageUrl',
        header: t(`products.table.image`),
        field: 'imageUrl',
        filter: false,
        sortable: false,
        body: (pr: ProductRow) => {
          const imageUrl = pr.imageUrl
          return <ProductThumbnail url={imageUrl} />
        },
      },
      {
        columnKey: 'name',
        header: t(`products.table.name`),
        field: `name`,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: getNameCell,
      },
      {
        columnKey: 'id',
        header: t(`products.table.id`),
        field: 'id',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'code',
        header: t(`products.table.code`),
        field: 'code',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'productType',
        header: t(`products.table.productType`),
        field: `productType`,
        filter: true,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: typeFilterElement,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: ProductRow) =>
          t(`products.types.${rowData.productType}`),
      },
      {
        columnKey: 'vendorName',
        header: t(`products.table.vendor`),
        field: 'vendorName',
        filterField: 'vendor.name',
        sortField: 'vendor.name',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'price',
        header: t(`products.table.price`),
        field: 'price',
        filter: false,
        sortable: false,
        showFilterMenu: false,
        showClearButton: false,
        ...numericColumn,
      },
    ]

    const rawColumns: DataTableColumnProps[] = [
      ...baseColumns.map((col) => ({
        ...col,
        hidden:
          visibleColumns.length > 0
            ? !visibleColumns.includes(col.columnKey ?? '')
            : false,
      })),
      ...visibleMixins.map((mixin) => parseColumnProps(mixin, getUiLangValue)),
    ]

    setFilters(rawColumns)
    rawColumns.push({
      columnKey: 'actions',
      filter: false,
      headerStyle: { width: '116px' },
      body: (rowData: ProductRow) => (
        <ProductsAction
          product={rowData}
          invalidateProducts={invalidateProducts}
        />
      ),
    })
    return rawColumns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, contentLanguage, visibleColumns, visibleMixinsKey])

  // Base columns carry `hidden`; mixin and actions columns are not toggleable.
  const configurableColumns = useMemo(
    () => columns.filter((column) => 'hidden' in column),
    [columns]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {extensionsContainer &&
        createPortal(
          <TableExtensions
            tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
            tableColumns={configurableColumns.map((column) =>
              String(column.columnKey ?? '')
            )}
            tableName={TABLE_NAME}
            schemaType={SchemaType.PRODUCT}
            managerPermission={canManage}
          />,
          extensionsContainer
        )}
      <DataTable
        data-testid="products-table"
        dataKey="id"
        value={products}
        columns={columns}
        selectionMode="multiple"
        selection={selectedProducts}
        onSelectionChange={(selection) =>
          setSelectedProducts((selection ?? []) as ProductRow[])
        }
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        pagination={pagination}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onPage={onPageCallback}
        lazy={true}
        onRowClick={(row) => {
          if (!clickToEdit) return
          navigate(productDetailPath(row.id))
        }}
        loading={productsLoading}
      />
    </div>
  )
}

export default ProductsTable
