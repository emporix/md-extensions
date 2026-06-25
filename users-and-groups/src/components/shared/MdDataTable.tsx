import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DataTableEditingRows,
  DataTableFilterParams,
  DataTablePFSEvent,
  DataTableRowClickEventParams,
  DataTableRowEditCompleteParams,
  DataTableRowExpansionTemplate,
  DataTableRowToggleParams,
  DataTableSelectionChangeParams,
  DataTableSortOrderType,
} from 'primereact/datatable'
import { Column, ColumnProps, ColumnSelectionModeType } from 'primereact/column'
import usePagination, { PaginationProps } from '../../hooks/usePagination'
import EmptyTable from './EmptyTable'
import { StylableProps } from '../../helpers/props'

type MdDataTableProps<T extends object> = StylableProps & {
  readonly dataKey?: string
  readonly columns?: ColumnProps[]
  readonly paginator?: boolean
  readonly value: T[]
  readonly selection?: T[] | T
  readonly editingRows?: T[] | DataTableEditingRows
  readonly setSelectedItems?: (items: T[]) => void
  readonly expandedRows?: T[]
  readonly onRowToggle?: (items: T[]) => unknown
  readonly onPage?: (event: DataTablePFSEvent) => unknown
  readonly onFilter?: (event: DataTableFilterParams) => unknown
  readonly onSort?: (event: DataTablePFSEvent) => unknown
  readonly rowClassName?: (item: T) => Record<string, unknown> | string
  readonly selectionMode?: ColumnSelectionModeType
  readonly header?: ReactNode
  readonly className?: string
  readonly editMode?: string
  readonly isLoading?: boolean
  readonly showEmpty?: boolean
  readonly emptyText?: string
  readonly emptyButtonLabel?: string
  readonly paginationOptions?: Partial<PaginationProps>
  readonly showFilter?: boolean
  readonly sortOrder?: DataTableSortOrderType
  readonly sortField?: string
  readonly globalFilterFields?: string[]
  readonly onRowClick?: (rowData: T, index: number) => unknown
  readonly emptyAction?: () => void
  readonly actions?: (items: T) => React.ReactNode
  readonly children?: ReactNode
  readonly isDataSelectable?: (data: { data: T }) => boolean
  readonly lazy?: boolean
  readonly footer?: ReactNode
  readonly onRowEditComplete?: (e: DataTableRowEditCompleteParams) => void
  readonly rowExpansionTemplate?: (
    data: T,
    options: DataTableRowExpansionTemplate
  ) => React.ReactNode
  readonly totalRecords?: number
  readonly dataTestId?: string
  readonly showHeaders?: boolean
}

const DEFAULT_PAGINATOR_TEMPLATE =
  'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'

const MdDataTable = <T extends object>({
  dataKey,
  columns,
  paginator = true,
  value,
  selection = [],
  editingRows,
  setSelectedItems,
  expandedRows,
  onRowToggle,
  onPage,
  onFilter,
  onSort,
  rowClassName,
  selectionMode,
  header,
  className = '',
  style,
  editMode,
  isLoading = false,
  showEmpty = true,
  emptyText,
  emptyButtonLabel,
  paginationOptions,
  showFilter = true,
  sortOrder,
  sortField,
  globalFilterFields,
  onRowClick,
  emptyAction,
  actions,
  children,
  isDataSelectable,
  lazy,
  footer,
  onRowEditComplete,
  rowExpansionTemplate,
  totalRecords,
  dataTestId,
  showHeaders = true,
}: MdDataTableProps<T>) => {
  const { t } = useTranslation()
  const pagination = usePagination(undefined, !paginationOptions)

  const columnsList = useMemo(() => {
    const cols: ColumnProps[] = columns ? [...columns] : []
    if (actions) {
      cols.push({
        columnKey: 'propsActions',
        headerStyle: { width: '116px' },
        body: actions,
      })
    }
    return cols
  }, [columns, actions])

  useEffect(() => {
    if (!paginationOptions) {
      pagination.setTotalCount(value.length)
    }
  }, [totalRecords, value.length, paginationOptions, pagination])

  const handleRowClick = (e: DataTableRowClickEventParams) => {
    if (onRowClick) {
      onRowClick(e.data as T, e.index)
      e.originalEvent.stopPropagation()
    }
  }

  const handleSelectionChange = (e: DataTableSelectionChangeParams) => {
    const isStopped = e.originalEvent.isPropagationStopped()
    if (setSelectedItems && !isStopped) {
      setSelectedItems(e.value as T[])
      e.originalEvent.stopPropagation()
    }
  }

  const handleRowToggle = (e: DataTableRowToggleParams) => {
    onRowToggle?.(e.data as T[])
  }

  const [filterResultsEmpty, setFilterResultsEmpty] = useState(false)

  const globalResultsEmpty = useMemo(() => {
    if (lazy) {
      return value.length === 0
    }
    return filterResultsEmpty
  }, [filterResultsEmpty, lazy, value])

  if (!value.length && !isLoading && showEmpty) {
    return (
      <EmptyTable
        text={emptyText ?? t('global.noDataFound')}
        buttonLabel={emptyButtonLabel}
        action={emptyAction}
      />
    )
  }

  const resolvedSelection =
    !globalResultsEmpty &&
    !(
      isDataSelectable &&
      value.length > 0 &&
      value.every((item) => !isDataSelectable({ data: item }))
    )
      ? selection
      : undefined

  return (
    <div className={className}>
      <DataTable
        style={style}
        data-test-id={dataTestId}
        className={`h-full ${showHeaders ? '' : 'datatable-no-header'}`}
        dataKey={dataKey}
        value={value.length > 0 ? value : undefined}
        size="small"
        onValueChange={(filtered) => {
          setFilterResultsEmpty(filtered.length === 0)
        }}
        responsiveLayout="scroll"
        onRowEditComplete={onRowEditComplete}
        rowClassName={rowClassName}
        editMode={editMode}
        editingRows={editingRows}
        rows={paginationOptions?.rows ?? pagination.paginationParams.rows}
        filterDisplay={showFilter ? 'row' : undefined}
        filters={
          paginationOptions?.filters ?? pagination.paginationParams.filters
        }
        globalFilterFields={
          globalFilterFields ?? paginationOptions?.globalFilterFields
        }
        paginator={paginator && !globalResultsEmpty}
        paginatorTemplate={DEFAULT_PAGINATOR_TEMPLATE}
        first={paginationOptions?.first ?? pagination.paginationParams.first}
        totalRecords={
          paginationOptions?.totalRecords ?? pagination.totalCount
        }
        rowsPerPageOptions={
          paginationOptions?.rowsPerPageOptions ??
          pagination.paginationParams.rowsPerPageOptions
        }
        sortField={sortField ?? pagination.paginationParams.sortField}
        sortOrder={sortOrder ?? pagination.paginationParams.sortOrder}
        onPage={onPage ?? pagination.onPageCallback}
        onSort={onSort ?? pagination.onSortCallback}
        onFilter={onFilter ?? pagination.onFilterCallback}
        currentPageReportTemplate={t('global.pagination')}
        stripedRows
        isDataSelectable={isDataSelectable}
        emptyMessage={() => (
          <EmptyTable
            text={emptyText ?? t('global.noDataFound')}
            buttonLabel={emptyButtonLabel}
            action={emptyAction}
          />
        )}
        loading={isLoading}
        removableSort
        onSelectionChange={handleSelectionChange}
        selection={resolvedSelection}
        onRowClick={handleRowClick}
        lazy={lazy}
        expandedRows={expandedRows}
        rowExpansionTemplate={rowExpansionTemplate}
        onRowToggle={handleRowToggle}
        footer={footer}
        header={header}
      >
        {selectionMode && (
          <Column
            selectionMode={selectionMode}
            headerStyle={{ width: '78px' }}
          />
        )}
        {columnsList.map((column) => (
          <Column key={column.columnKey} {...column} />
        ))}
        {children}
      </DataTable>
    </div>
  )
}

export default MdDataTable
