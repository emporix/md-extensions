import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { BsDownload } from 'react-icons/bs'
import { ProductRow } from '@emporix/api-calls'
import {
  DataTable,
  SecondaryButton,
  type DataTableColumnProps,
  type DataTableFilterEvent,
  type DataTablePageEvent,
  type DataTablePaginationState,
  type DataTableSortEvent,
} from '@emporix/component-library'
import { useCategoriesApi } from '../../hooks/api/categories'
import { DisplayMixin, parseColumnProps } from '../../models/DisplayMixin'
import { PaginationProps } from '../../hooks/usePagination'
import LeafCategoriesTree from '../categoriesTree/LeafCategoriesTree'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { ProductsAction } from '../../pages/ProductsList.page'
import TableExtensions from '../shared/TableExtensions'
import { mapToCsv, saveToCsvFile } from '../../helpers/download'
import { SchemaType } from '../../models/Schema.model'
import { formatDateWithTime } from '../../helpers/date'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlocker'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { TABLE_NAME, TABLE_NAME_CONFIG_KEY } from './ProductsTable'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { productDetailPath } from '../../constants/paths'
import styles from './CategoriesProductsTable.module.scss'
import { ProductThumbnail } from '../shared/ProductThumbnail'

const mapToSortField = (
  paginationParams: Partial<PaginationProps>
): Partial<PaginationProps> => {
  if (paginationParams.sortField === 'ref.localizedName') {
    paginationParams.sortField = 'name'
  }
  if (paginationParams.sortField === 'ref.id') {
    paginationParams.sortField = 'id'
  }
  return paginationParams
}

type CategoriesProductsTableProps = {
  readonly categoryId: string | null
  readonly setCategoryId: (newId: string) => unknown
  readonly paginationParams: Partial<PaginationProps>
  readonly onPageCallback: (event: DataTablePageEvent) => void
  readonly setPaginationParams: (p: Partial<PaginationProps>) => unknown
  readonly refreshKey: number
  readonly products: ProductRow[]
  readonly setTotalCount: (num: number) => unknown
  readonly totalCount: number
  readonly setProducts: (products: ProductRow[]) => unknown
  readonly selectedProducts: ProductRow[]
  readonly setSelectedProducts: (products: ProductRow[]) => unknown
  readonly clickToEdit: boolean
  readonly invalidateProducts: () => unknown
  readonly visibleColumns: string[]
  readonly visibleMixins: DisplayMixin[]
  readonly setFilters: (columns: DataTableColumnProps[]) => void
  /** Toolbar slot the column settings are portalled into (MD `#table-extensions`). */
  readonly extensionsContainer?: HTMLElement | null
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
  invalidateProducts,
  visibleColumns,
  visibleMixins,
  setFilters,
  extensionsContainer,
}: CategoriesProductsTableProps) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null)
  const { syncCategoryAssignments, getAllCategoryProducts } = useCategoriesApi()
  const [productsLoading, setProductsLoading] = useState(false)
  const { navigate } = useCustomNavigate()
  const { t, i18n } = useTranslation()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)
  const { blockPanel } = useUIBlocker()
  const { tenant } = useDashboardContext()
  // Bumped by every product load, so results for an earlier category, page
  // or tenant are dropped.
  const loadIdRef = useRef(0)
  const { getUiLangValue, getContentLangValue } = useLocalizedValue()

  // Products of another tenant must not stay usable while its tree loads.
  useUpdateEffect(() => {
    setProducts([])
    setTotalCount(0)
    setSelectedProducts([])
    setSelectedNodeKey(null)
  }, [tenant])

  useEffect(() => {
    const loadId = ++loadIdRef.current
    void (async () => {
      if (!categoryId) {
        setProductsLoading(false)
        return
      }
      try {
        setProductsLoading(true)
        const { total, productRows } = await syncCategoryAssignments(
          categoryId,
          mapToSortField(JSON.parse(JSON.stringify(paginationParams)))
        )
        if (loadId !== loadIdRef.current) return
        setTotalCount(total)
        setProducts(productRows)
        setSelectedNodeKey(categoryId)
      } finally {
        if (loadId === loadIdRef.current) {
          setProductsLoading(false)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, paginationParams, refreshKey, tenant])

  const onFilterCallback = (event: DataTableFilterEvent) => {
    setPaginationParams({
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: event.filters,
    })
  }

  const onSortCallback = (event: DataTableSortEvent) => {
    setPaginationParams({
      ...paginationParams,
      sortOrder: event.sortOrder ?? null,
      sortField: event.sortField,
    })
  }

  const selectHandler = (id: string) => {
    setCategoryId(id)
  }

  const productsActions = (rowData: ProductRow) => {
    if (rowData.missingProduct) {
      return (
        <span className={styles.missingProduct}>
          <i
            className={`pi pi-exclamation-triangle ${styles.missingProductIcon}`}
          />
          <span>{t('products.table.missingProduct')}</span>
        </span>
      )
    }
    return (
      <ProductsAction
        product={rowData}
        invalidateProducts={invalidateProducts}
      />
    )
  }

  const visibleMixinsKey = JSON.stringify(visibleMixins)

  const columns = useMemo(() => {
    const rawColumns: DataTableColumnProps[] = [
      ...(
        [
          {
            columnKey: 'imageUrl',
            header: t(`${TABLE_NAME}.image`),
            field: 'imageUrl',
            filter: false,
            sortable: false,
            body: (pr: ProductRow) => <ProductThumbnail url={pr.imageUrl} />,
          },
          {
            columnKey: 'ref.localizedName',
            header: t(`${TABLE_NAME}.name`),
            field: `ref.localizedName`,
            filter: true,
            sortable: true,
            showFilterMenu: false,
            showClearButton: false,
            body: (rowData: ProductRow) =>
              getContentLangValue(rowData.ref.localizedName),
          },
          {
            columnKey: 'ref.id',
            header: t(`${TABLE_NAME}.id`),
            field: 'ref.id',
            filter: true,
            sortable: true,
            showFilterMenu: false,
            showClearButton: false,
          },
          {
            columnKey: 'code',
            header: t(`${TABLE_NAME}.code`),
            field: 'code',
            filter: true,
            sortable: true,
            showFilterMenu: false,
            showClearButton: false,
          },
          {
            columnKey: 'productType',
            header: t(`${TABLE_NAME}.productType`),
            field: 'productType',
            filter: false,
            sortable: true,
            showFilterMenu: false,
            showClearButton: false,
          },
          {
            columnKey: 'price',
            header: t(`${TABLE_NAME}.price`),
            field: 'price',
            filter: false,
            sortable: false,
            showFilterMenu: false,
            showClearButton: false,
            style: { paddingRight: '2rem' },
          },
        ] satisfies DataTableColumnProps[]
      ).map((col) => ({
        ...col,
        hidden:
          visibleColumns.length > 0
            ? !visibleColumns.includes(col.columnKey)
            : false,
      })),
      ...visibleMixins.map((mixin) =>
        parseColumnProps(mixin, getUiLangValue, false)
      ),
    ]
    setFilters(rawColumns)
    rawColumns.push({
      columnKey: 'actions',
      showFilterMenu: false,
      body: productsActions,
    })
    return rawColumns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, visibleColumns, t, visibleMixinsKey])

  // Base columns carry `hidden`; mixin and actions columns are not toggleable.
  const configurableColumns = useMemo(
    () => columns.filter((column) => 'hidden' in column),
    [columns]
  )

  const exportToCsv = useCallback(async () => {
    try {
      blockPanel(true)
      if (categoryId) {
        const result = await getAllCategoryProducts(categoryId)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={styles.wrapper}>
      {extensionsContainer &&
        createPortal(
          <div className={styles.extensions}>
            {/* MD TableExtensions `csvExportHandler` button; the remote
                TableExtensions has no such prop, so it is rendered here. */}
            <SecondaryButton
              size="small"
              iconOnly
              onClick={() => void exportToCsv()}
              aria-label={t('global.download')}
            >
              <BsDownload size={18} />
            </SecondaryButton>
            <TableExtensions
              tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
              tableColumns={configurableColumns.map((column) =>
                String(column.columnKey ?? '')
              )}
              tableName={TABLE_NAME}
              schemaType={SchemaType.PRODUCT}
              managerPermission={canManage}
            />
          </div>,
          extensionsContainer
        )}
      <div className={styles.sidebar}>
        <LeafCategoriesTree
          selectedNodeKey={selectedNodeKey}
          onSelectCategory={selectHandler}
        />
      </div>
      <DataTable
        className={styles.table}
        dataKey="id"
        value={products}
        columns={columns}
        selectionMode="multiple"
        selection={selectedProducts}
        onSelectionChange={(selection) =>
          setSelectedProducts((selection ?? []) as ProductRow[])
        }
        isRowSelectable={(data) => !data.data.missingProduct}
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onPage={onPageCallback}
        onRowClick={(row) => {
          if (!clickToEdit || row.missingProduct) return
          navigate(productDetailPath(row.id))
        }}
        loading={productsLoading}
        lazy={true}
      />
    </div>
  )
}

export default CategoriesProductsTable
