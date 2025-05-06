import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Column,
  ColumnFilterElementTemplateOptions,
  ColumnProps,
} from 'primereact/column'
import {
  DataTable,
  DataTableFilterParams,
  DataTablePageParams,
  DataTableSortParams,
} from 'primereact/datatable'
import { ProductRow, useCategoriesApi } from '../../api/categories'
import { DisplayMixin, parseColumnProps } from '../../models/DisplayMixin'
import { PaginationProps } from '../../hooks/usePagination'
import ProductsCategoryTree from './ProductsCategoryTree'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'
import MdDataTable from '../shared/MdDataTable'
import TreeNode from 'primereact/treenode'
import { TreeNodeTemplateOptions } from 'primereact/tree'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { ProductsAction } from '../../pages/ProductsList.tsx'
import { trimImage } from '../../helpers/images'
import { createPortal } from 'react-dom'
import { TableExtensions } from '../shared/TableExtensions'
import { mapToCsv, saveToCsvFile } from '../../helpers/download'
import { SchemaType } from '../../models/Schema'
import { formatDateWithTime } from '../../helpers/date'
import { useUIBlocker } from '../../context/UIBlcoker'
import { TABLE_NAME, TABLE_NAME_CONFIG_KEY } from './ProductsTable'
import { useDomObserver } from '../../hooks/useDomObserver'
import { DropdownFilter } from '../shared/DropdownFilter'
import { ProductType } from '../../models/Category'
import { SelectItemOptionsType } from 'primereact/selectitem'
import { useDashboardContext } from '../../context/Dashboard.context'

const mapToSortField = (paginationParams: PaginationProps): PaginationProps => {
  if (paginationParams.sortField === 'ref.localizedName') {
    paginationParams.sortField = 'name'
  }
  if (paginationParams.sortField === 'ref.id') {
    paginationParams.sortField = 'id'
  }
  return paginationParams
}

interface ProductsTableProps {
  categoryId: string | null
  setCategoryId: (newId: string) => unknown
  paginationParams: Partial<PaginationProps>
  onPageCallback: (event: DataTablePageParams) => void
  setPaginationParams: (p: Partial<PaginationProps>) => unknown
  onSortCallback: (event: DataTableSortParams) => void
  dataTable: RefObject<DataTable>
  refreshKey: number
  products: ProductRow[]
  setTotalCount: (num: number) => unknown
  totalCount: number
  setProducts: (products: ProductRow[]) => unknown
  selectedProducts: ProductRow[]
  setSelectedProducts: (products: ProductRow[]) => unknown
  clickToEdit: boolean
  treeNodeTemplate?: (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => ReactNode
  invalidateProducts: () => unknown
  visibleColumns: string[]
  visibleMixins: DisplayMixin[]
  setFilters: (columns: ColumnProps[]) => void
  columns?: ColumnProps[]
  showTableExtensions?: boolean
}

const CSV_COLUMNS = ['id', 'name', 'price']

const CategoriesProductsTable = ({
  paginationParams,
  onPageCallback,
  refreshKey,
  totalCount,
  setTotalCount,
  products,
  setProducts,
  categoryId,
  setCategoryId,
  selectedProducts,
  setSelectedProducts,
  setPaginationParams,
  clickToEdit,
  treeNodeTemplate,
  invalidateProducts,
  visibleColumns,
  visibleMixins,
  setFilters,
  columns: columnsProps,
  showTableExtensions = true,
}: ProductsTableProps) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null)
  const { syncCategoryAssignments } = useCategoriesApi()
  const [productsLoading, setProductsLoading] = useState(false)
  const { navigate } = useCustomNavigate()
  const { t, i18n } = useTranslation()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const { blockPanel } = useUIBlocker()
  const { fetchAllCategoryProducts } = useCategoriesApi()

  const { getUiLangValue, getContentLangValue } = useLocalizedValue()
  useEffect(() => {
    ;(async () => {
      if (!categoryId) {
        return
      }
      try {
        setProductsLoading(true)
        const { total, productRows } = await syncCategoryAssignments(
          categoryId,
          mapToSortField(
            JSON.parse(JSON.stringify(paginationParams as PaginationProps))
          )
        )
        setTotalCount(total)
        setProducts(productRows)
        setSelectedNodeKey(categoryId)
      } finally {
        setProductsLoading(false)
      }
    })()
  }, [categoryId, paginationParams, refreshKey])

  const onFilterCallback = (event: DataTableFilterParams) => {
    setPaginationParams({
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: event.filters,
    })
  }

  const onSortCallback = (event: DataTableSortParams) => {
    setPaginationParams({
      ...paginationParams,
      sortOrder: event.sortOrder,
      sortField: event.sortField,
    })
  }

  const selectHandler = async (id: string) => {
    setCategoryId(id)
  }

  const productsActions = (rowData: { id: string }) => {
    return (
      <ProductsAction
        productId={rowData.id}
        invalidateProducts={invalidateProducts}
      />
    )
  }

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
          placeholder={t('products.table.filters.type')}
        />
      )
    },
    [i18n.language, productTypesDropdownOptions]
  )

  const columns = useMemo(() => {
    if (columnsProps) {
      return columnsProps
    }
    let rawColumns: ColumnProps[] = [
      {
        columnKey: 'imageUrl',
        header: t(`${TABLE_NAME}.image`),
        field: 'imageUrl',
        filter: false,
        sortable: false,
        body: (pr: ProductRow) => {
          return (
            <img
              className="thumb"
              src={trimImage(pr.imageUrl as string, 32, 32)}
              alt={pr.imageUrl || 'imageUrl'}
            />
          )
        },
      },
      {
        columnKey: 'ref.localizedName',
        header: t(`${TABLE_NAME}.name`),
        filterPlaceholder: t(`${TABLE_NAME}.filters.name`),
        field: `ref.localizedName`,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        body: (rowData: ProductRow) => {
          return getContentLangValue(rowData.ref.localizedName)
        },
      },
      {
        columnKey: 'ref.id',
        header: t(`${TABLE_NAME}.id`),
        filterPlaceholder: t(`${TABLE_NAME}.filters.id`),
        field: 'ref.id',
        filter: true,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'code',
        header: t(`${TABLE_NAME}.code`),
        filterPlaceholder: t(`${TABLE_NAME}.filters.code`),
        field: 'code',
        filter: true,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'productType',
        header: t(`${TABLE_NAME}.productType`),
        filterPlaceholder: t(`${TABLE_NAME}.filters.productType`),
        field: 'productType',
        filter: true,
        filterElement: typeFilterElement,
        sortable: true,
        showFilterMenu: false,
      },
      {
        columnKey: 'price',
        header: t(`${TABLE_NAME}.price`),
        field: 'price',
        filter: false,
        sortable: false,
        showFilterMenu: false,
        style: { paddingRight: '2rem' },
      },
    ].map((col) => {
      return {
        ...col,
        hidden:
          visibleColumns.length > 0
            ? !visibleColumns.includes(col.columnKey)
            : false,
      }
    })
    rawColumns = [
      ...rawColumns,
      ...visibleMixins.map((mixin) => parseColumnProps(mixin, getUiLangValue)),
    ]
    setFilters(rawColumns)
    rawColumns.push({
      columnKey: 'actions',
      showFilterMenu: false,
      body: productsActions,
    })
    return rawColumns
  }, [
    i18n.language,
    TABLE_NAME,
    visibleColumns,
    t,
    JSON.stringify(visibleMixins),
    columnsProps,
  ])

  const exportToCsv = useCallback(async () => {
    try {
      blockPanel(true)
      if (categoryId) {
        const result = await fetchAllCategoryProducts(categoryId)
        const data = mapToCsv(CSV_COLUMNS, result, (pr: ProductRow) => {
          return [pr.id, pr.name, pr.price]
        })
        saveToCsvFile(
          categoryId + '-' + formatDateWithTime(new Date()) + '.csv',
          data
        )
      }
    } finally {
      blockPanel(false)
    }
  }, [categoryId])

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
            csvExportHandler={exportToCsv}
            tableName={TABLE_NAME}
            schemaType={SchemaType.PRODUCT}
            managerPermission={canBeManaged}
          />,
          document.getElementById('table-extensions') as HTMLElement
        )}
      <div className="col-3 tree">
        <ProductsCategoryTree
          table={false}
          selectHandler={selectHandler}
          selectedNodeKeys={selectedNodeKey}
          treeNodeTemplate={treeNodeTemplate}
        />
      </div>
      <div className="col-9" style={{ minHeight: '50vh' }}>
        <MdDataTable
          className={'h-full'}
          setSelectedItems={setSelectedProducts}
          selection={selectedProducts}
          value={products}
          paginationOptions={{
            ...paginationParams,
            totalRecords: totalCount,
          }}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          onPage={onPageCallback}
          onRowClick={(d) => {
            if (!clickToEdit) return
            navigate(`/products/${d.id}`)
          }}
          isLoading={productsLoading}
          dataKey={'id'}
          selectionMode="multiple"
        >
          {columns.map((column: ColumnProps) => {
            return <Column key={column.columnKey} {...column} />
          })}
        </MdDataTable>
      </div>
    </div>
  )
}

export default CategoriesProductsTable
