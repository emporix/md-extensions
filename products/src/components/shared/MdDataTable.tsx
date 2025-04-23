import { ReactNode, useEffect, useMemo, useState } from 'react'
import usePagination, { PaginationProps } from '../../hooks/usePagination'
import {
  DataTable,
  DataTableEditingRows,
  DataTableFilterParams,
  DataTableFooterTemplateType,
  DataTableHeaderTemplateType,
  DataTablePFSEvent,
  DataTableRowClickEventParams,
  DataTableRowEditCompleteParams,
  DataTableRowExpansionTemplate,
  DataTableRowToggleParams,
  DataTableSelectionChangeParams,
  DataTableSortOrderType,
} from 'primereact/datatable'
import { Column, ColumnProps, ColumnSelectionModeType } from 'primereact/column'
import { useTranslation } from 'react-i18next'
import EmptyTable from './EmptyTable'

interface Props<T> {
  dtRef?: React.Ref<DataTable>
  dataKey?: string
  columns?: ColumnProps[]
  paginator?: boolean
  value: T[]
  selection?: T[] | T
  emptyMessage?: string
  editingRows?: any[] | DataTableEditingRows
  setSelectedItems?: (items: T[]) => void
  expandedRows?: T[]
  onRowToggle?: (items: T[]) => unknown
  onPage?: (event: DataTablePFSEvent) => unknown
  onFilter?: (event: DataTableFilterParams) => unknown
  onSort?: (event: DataTablePFSEvent) => unknown
  rowClassName?: (item: T) => Record<string, any> | string
  selectionMode?: ColumnSelectionModeType
  header?: DataTableHeaderTemplateType
  className?: string
  editMode?: string
  isLoading?: boolean
  showEmpty?: boolean
  emptyText?: string
  emptyButtonLabel?: string
  paginationOptions?: Partial<PaginationProps>
  showHeader?: boolean
  showFilter?: boolean
  sortOrder?: DataTableSortOrderType
  sortField?: string
  globalFilterFields?: string[]
  onRowClick?: (rowData: T, index: number) => unknown
  emptyAction?: () => void
  actions?: (items: T) => React.ReactNode
  children?: ReactNode
  isDataSelectable?: (data: { data: T }) => boolean
  lazy?: boolean
  footer?: DataTableFooterTemplateType
  onRowEditComplete?: (e: DataTableRowEditCompleteParams) => void
  rowExpansionTemplate?: (
    data: any,
    options: DataTableRowExpansionTemplate
  ) => React.ReactNode
  onParamsChange?: (event: Partial<PaginationProps>) => void
  totalRecords?: number
  dataTestId?: string
}

const defaultProps = {
  selection: [],
  className: '',
  isLoading: false,
  showEmpty: true,
  showHeader: true,
  showFilter: true,
  children: null,
  value: [],
  paginator: true,
}

const MdDataTable = <T,>(props: Props<T>) => {
  const { i18n, t } = useTranslation()
  const pagination = usePagination()

  const columnsList = useMemo(() => {
    const columns: ColumnProps[] = props.columns ? [...props.columns] : []
    if (props.actions) {
      columns.push({
        columnKey: 'propsActions',
        headerStyle: { width: '116px' },
        body: props.actions,
      })
    }
    return columns
  }, [i18n, props.columns, props.actions])

  useEffect(() => {
    if (!props.paginationOptions) {
      pagination.setTotalCount(props.value.length)
    }
  }, [props.totalRecords])

  const onRowClick = (e: DataTableRowClickEventParams) => {
    if (props.onRowClick) {
      props.onRowClick(e.data, e.index)
      e.originalEvent.stopPropagation()
    }
  }

  const onSelectionChange = (e: DataTableSelectionChangeParams) => {
    const isStopped = e.originalEvent.isPropagationStopped()
    if (props.setSelectedItems && !isStopped) {
      props.setSelectedItems(e.value as T[])
      e.originalEvent.stopPropagation()
    }
  }

  const handleRowToggle = (e: DataTableRowToggleParams) => {
    if (props.onRowToggle) {
      props.onRowToggle(e.data as T[])
    }
  }

  const [filterResultsEmpty, setIsFilterResultsEmpty] = useState(false)

  // when filtering locally you have to rely on onValueChange but when filtering lazy that
  // same method returns incorrect results, so we have to rely on the value prop
  const globalResultsEmpty = useMemo(() => {
    if (props.lazy) {
      return props.value.length === 0
    } else {
      return filterResultsEmpty
    }
  }, [filterResultsEmpty, props.lazy, props.value])

  return (
    <div className={`${props.className}`}>
      {props.value || props.isLoading || !props.showEmpty ? (
        <DataTable
          data-test-id={props.dataTestId}
          className="h-full"
          ref={props.dtRef}
          dataKey={props.dataKey}
          value={props.value.length > 0 ? props.value : undefined}
          size="small"
          onValueChange={(value) => {
            setIsFilterResultsEmpty(value.length === 0)
          }}
          responsiveLayout="scroll"
          onRowEditComplete={props.onRowEditComplete}
          rowClassName={props.rowClassName}
          editMode={props.editMode}
          editingRows={props.editingRows}
          rows={
            props.paginationOptions?.rows || pagination.paginationParams.rows
          }
          filterDisplay={props.showFilter ? 'row' : undefined}
          filters={
            props.paginationOptions?.filters ||
            pagination.paginationParams.filters
          }
          globalFilterFields={
            props.globalFilterFields ||
            props.paginationOptions?.globalFilterFields
          }
          paginator={props.paginator && !globalResultsEmpty}
          first={
            props.paginationOptions?.first || pagination.paginationParams.first
          }
          totalRecords={
            props.paginationOptions?.totalRecords || pagination.totalCount
          }
          rowsPerPageOptions={
            props.paginationOptions?.rowsPerPageOptions ||
            pagination.paginationParams.rowsPerPageOptions
          }
          sortField={props.sortField || pagination.paginationParams.sortField}
          sortOrder={props.sortOrder || pagination.paginationParams.sortOrder}
          onPage={props.onPage || pagination.onPageCallback}
          onSort={props.onSort || pagination.onSortCallback}
          onFilter={props.onFilter || pagination.onFilterCallback}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate={t('global.pagination')}
          stripedRows
          isDataSelectable={props.isDataSelectable}
          emptyMessage={() => {
            return (
              <EmptyTable
                text={props.emptyText || t('global.noDataFound')}
                buttonLabel={props.emptyButtonLabel}
                action={props.emptyAction}
              />
            )
          }}
          loading={props.isLoading}
          removableSort
          onSelectionChange={onSelectionChange}
          // reset selection to prevent showing selected all when list empty
          selection={!globalResultsEmpty && props.selection}
          onRowClick={onRowClick}
          lazy={props.lazy}
          expandedRows={props.expandedRows}
          rowExpansionTemplate={props.rowExpansionTemplate}
          onRowToggle={handleRowToggle}
          footer={props.footer}
          header={props.header}
          selectionMode={props.selectionMode}
        >
          {props.selectionMode && (
            <Column
              selectionMode={props.selectionMode}
              headerStyle={{
                width: '78px',
              }}
            />
          )}

          {props.columns &&
            columnsList.map((column) => {
              return <Column key={column.columnKey} {...column} />
            })}
          {props.children}
        </DataTable>
      ) : (
        <EmptyTable
          text={props.emptyText || t('global.noDataFound')}
          buttonLabel={props.emptyButtonLabel}
          action={props.emptyAction}
        />
      )}
    </div>
  )
}

MdDataTable.defaultProps = defaultProps
export default MdDataTable
