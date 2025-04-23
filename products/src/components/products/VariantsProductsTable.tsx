import { useEffect, useRef, useState } from 'react'
import { Column, ColumnProps } from 'primereact/column'
import {
  DataTable,
  DataTableFilterMeta,
  DataTableRowClickEventParams,
} from 'primereact/datatable'
import { useProductsApi } from '../../api/products'
import usePagination from '../../hooks/usePagination'
import { Product } from '../../models/Category'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'
import { useUIBlocker } from '../../context/UIBlcoker'

interface ProductsTableComponentProps {
  columns: ColumnProps[]
  onRowClick?: (event: DataTableRowClickEventParams) => void
  preFilters: DataTableFilterMeta
}

export const VariantsProductsTable = (props: ProductsTableComponentProps) => {
  const { preFilters } = props
  const dataTable = useRef(null)
  const { blockPanel } = useUIBlocker()
  const { columns, onRowClick } = props
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const { syncPaginatedProducts } = useProductsApi()
  const {
    paginationParams,
    onFilterCallback,
    onSortCallback,
    onPageCallback,
    setTotalCount,
    totalCount,
  } = usePagination({ currentPage: 1, rows: 10, first: 0 }, false)

  const { navigate } = useCustomNavigate()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { totalCount, data } = await syncPaginatedProducts({
        ...paginationParams,
        filters: { ...paginationParams.filters, ...preFilters },
      })
      setProducts(data)
      setTotalCount(totalCount)
      setLoading(false)
    })()
  }, [preFilters, paginationParams])

  return (
    <DataTable
      className={'h-full'}
      size="small"
      sortField="created"
      sortOrder={-1}
      ref={dataTable}
      lazy
      value={products}
      paginator
      totalRecords={totalCount}
      filterDisplay="row"
      rowHover
      onFilter={onFilterCallback}
      onSort={onSortCallback}
      onPage={onPageCallback}
      onRowClick={(e) => {
        blockPanel(true)
        try {
          onRowClick
            ? onRowClick(e)
            : navigate(`/products/${e.data.id}`, {
                replace: false,
              })
        } catch (e) {
          console.error(e)
        } finally {
          blockPanel(false)
        }
      }}
      rows={paginationParams.rows}
      stripedRows
      responsiveLayout="scroll"
      removableSort
      loading={loading}
      first={paginationParams.first}
      filters={paginationParams.filters}
    >
      {columns.map((column: ColumnProps) => {
        return <Column key={column.field} {...column} />
      })}
    </DataTable>
  )
}
