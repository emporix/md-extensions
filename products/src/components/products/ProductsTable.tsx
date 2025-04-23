import { RefObject, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Column,
  ColumnFilterElementTemplateOptions,
  ColumnProps,
} from 'primereact/column'
import { ProductRow } from '../../api/categories'
import { PaginationProps } from '../../hooks/usePagination'
import { useProductsApi } from '../../api/products'
import { useTranslation } from 'react-i18next'
import { ProductsAction } from '../../pages/ProductsList'
import logoDark from '../../../assets/images/logoDark.png'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { DropdownFilter } from '../shared/DropdownFilter'
import { SelectItemOptionsType } from 'primereact/selectitem'
import { ProductType } from '../../models/Category'
import MdDataTable from '../shared/MdDataTable'
import {
  DataTable,
  DataTableFilterParams,
  DataTablePageParams,
  DataTableSortParams,
} from 'primereact'
import { numericColumn } from '../shared/NumericColumn'
import { DisplayMixin, parseColumnProps } from '../../models/DisplayMixin'
import { TableExtensions } from '../shared/TableExtensions'
import { createPortal } from 'react-dom'
import { SchemaType } from '../../models/Schema'
import { useDomObserver } from '../../hooks/useDomObserver'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export const TABLE_NAME = 'products.table'
export const TABLE_NAME_CONFIG_KEY = 'ext_products'

interface ProductsTableProps {
  dataTable: RefObject<DataTable>
  paginationParams: Partial<PaginationProps>
  onPageCallback: (event: DataTablePageParams) => void
  onSortCallback: (event: DataTableSortParams) => void
  onFilterCallback: (event: DataTableFilterParams) => void
  setPaginationParams: (p: Partial<PaginationProps>) => unknown
  refreshKey: number
  invalidateProducts: () => void
  products: ProductRow[]
  setTotalCount: (num: number) => unknown
  totalCount: number
  setProducts: (products: ProductRow[]) => unknown
  selectedProducts: ProductRow[]
  setSelectedProducts: (products: ProductRow[]) => unknown
  visibleColumns: string[]
  clickToEdit: boolean
  visibleMixins: DisplayMixin[]
  setFilters: (columns: ColumnProps[]) => void
  columns?: ColumnProps[]
  showTableExtensions: boolean
}

const ProductsTable = (props: ProductsTableProps) => {
  const {
    paginationParams,
    onSortCallback,
    onPageCallback,
    onFilterCallback,
    dataTable,
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
    showTableExtensions = true,
    columns: columnsProps,
  } = props
  const { syncPaginatedProductsRows } = useProductsApi()
  const [productsLoading, setProductsLoading] = useState(false)
  const { getContentLangValue } = useLocalizedValue()
  const { contentLanguage } = useDashboardContext()
  const { tenant } = useDashboardContext()
  const { getUiLangValue } = useLocalizedValue()
  const { t, i18n } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  useEffect(() => {
    ;(async () => {
      try {
        setProductsLoading(true)
        const { totalCount, data } = await syncPaginatedProductsRows(
          paginationParams as PaginationProps
        )
        setTotalCount(totalCount)
        setProducts(data)
      } finally {
        setProductsLoading(false)
      }
    })()
  }, [paginationParams, refreshKey, tenant])

  const getNameCell = useCallback(
    (rowData: ProductRow) => {
      return getContentLangValue(rowData.ref.localizedName)
    },
    [contentLanguage]
  )

  const productTypesDropdownOptions: SelectItemOptionsType = useMemo(() => {
    return Object.values(ProductType).map((type) => ({
      value: type,
      label: t(`products.types.${type}`),
    }))
  }, [i18n.language])

  const typeFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => {
      return (
        <DropdownFilter
          dropdownOptions={productTypesDropdownOptions}
          filterOptions={options}
          placeholder={t('productTemplates.attributes.table.filter.type')}
        />
      )
    },
    [i18n.language, productTypesDropdownOptions]
  )

  const columns = useMemo(() => {
    if (columnsProps) {
      return columnsProps
    }
    let rawColumns = [
      {
        columnKey: 'imageUrl',
        header: t(`products.table.image`),
        field: 'imageUrl',
        filter: false,
        sortable: false,
        body: (pr: ProductRow) => {
          return (
            <img
              className="thumb"
              src={pr.imageUrl ? pr.imageUrl : logoDark}
              alt={pr.imageUrl ?? 'imageUrl'}
            />
          )
        },
      },
      {
        columnKey: 'name',
        header: t(`products.table.name`),
        filterPlaceholder: t(`products.table.filters.name`),
        field: `name`,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        body: getNameCell,
      },
      {
        columnKey: 'id',
        header: t(`products.table.id`),
        filterPlaceholder: t(`products.table.filters.id`),
        field: 'id',
        filter: true,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'code',
        header: t(`products.table.code`),
        filterPlaceholder: t(`products.table.filters.code`),
        field: 'code',
        filter: true,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'productType',
        header: t(`products.table.productType`),
        filterPlaceholder: t(`products.table.filters.productType`),
        field: `productType`,
        filter: true,
        filterMatchMode: 'equals',
        filterElement: typeFilterElement,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'price',
        header: t(`products.table.price`),
        field: 'price',
        filter: false,
        sortable: false,
        showFilterMenu: false,
        ...numericColumn,
      },
    ].map((col) => {
      return {
        ...col,
        hidden:
          visibleColumns.length > 0
            ? !visibleColumns.includes(col.columnKey)
            : false,
      }
    }) as ColumnProps[]
    rawColumns = [
      ...rawColumns,
      ...visibleMixins.map((mixin) => parseColumnProps(mixin, getUiLangValue)),
    ]

    setFilters(rawColumns)
    rawColumns.push({
      columnKey: 'actions',
      filter: false,
      headerStyle: { width: '116px' },
      body: (rowData: { id: string }) => {
        return (
          <ProductsAction
            productId={rowData.id}
            invalidateProducts={invalidateProducts}
          />
        )
      },
    })
    return rawColumns
  }, [
    i18n.language,
    contentLanguage,
    visibleColumns,
    JSON.stringify(visibleMixins),
  ])

  const isDomReady = useDomObserver()

  return (
    <div className="grid grid-nogutter products-table">
      {showTableExtensions &&
        isDomReady &&
        createPortal(
          <TableExtensions
            tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
            tableColumns={columns
              .filter((column) => Object.hasOwn(column, 'hidden'))
              .map((column) => column.columnKey ?? '')}
            tableName={TABLE_NAME}
            schemaType={SchemaType.PRODUCT}
            managerPermission={canBeManaged}
          />,
          document.getElementById('table-extensions') as HTMLElement
        )}
      <div className="col-12" style={{ minHeight: '50vh' }}>
        <MdDataTable
          data-test-id="products-table"
          className={'h-full'}
          setSelectedItems={setSelectedProducts}
          selection={selectedProducts}
          value={products}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          dtRef={dataTable}
          paginationOptions={{
            ...paginationParams,
            totalRecords: totalCount,
          }}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          onPage={onPageCallback}
          lazy={true}
          onRowClick={(e) => {
            if (!clickToEdit) return
            navigate(`/products/${e.id}`)
          }}
          isLoading={productsLoading}
          dataKey={'id'}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
          {columns.map((column: any) => {
            return <Column key={column.key} {...column} />
          })}
        </MdDataTable>
      </div>
    </div>
  )
}

export default ProductsTable
