import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import { LegalEntityActions } from './LegalEntityActions'
import usePagination from '../../hooks/usePagination'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCompaniesColumns, {
  type CompanyColumnProps,
} from '../../hooks/useCompaniesColumns'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
} from '../../helpers/api'
import { parseTableColumns } from '../../helpers/tables'
import type { StylableProps } from '../../helpers/props'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import type { LegalEntity } from '../../models/LegalEntity.model'
import { SchemaType } from '../../models/Schema.model'
import { companyDetailPath } from '../../constants/paths'
import styles from './CompaniesTable.module.scss'

export const TABLE_NAME = 'companies'
/** Configuration key the column-visibility preference is stored under (MD). */
export const TABLE_NAME_CONFIG_KEY = 'ext_companies'

type CompaniesTableProps = StylableProps & {
  readonly canManage: boolean
}

/**
 * MD `parseTableColumns` hides a `defaultHidden` column until the user saves a
 * visibility for it; the remote helper has no `defaultHidden`, so the default
 * is folded into the visibility list here.
 */
const withDefaultVisibility = (
  columns: CompanyColumnProps[],
  saved: ColumnVisibility[]
): ColumnVisibility[] =>
  columns.map((column) => {
    const key = String(column.columnKey ?? '')
    return (
      saved.find((entry) => entry.key === key) ?? {
        key,
        label: String(column.header ?? ''),
        visible: !column.defaultHidden,
      }
    )
  })

const CompaniesTable = ({ canManage, className = '' }: CompaniesTableProps) => {
  const { i18n, t } = useTranslation()
  const {
    paginationParams,
    totalCount,
    onPageCallback,
    onFilterCallback,
    onSortCallback,
    setFilters,
    setTotalCount,
  } = usePagination()
  const { getTableMixinColumns, tableConfigurations, fetchTableConfiguration } =
    useConfiguration()
  const { getUiLangValue } = useLocalizedValue()
  const { columns: baseColumns } = useCompaniesColumns()
  const [selected, setSelected] = useState<LegalEntity[]>([])
  const [tableData, setTableData] = useState<LegalEntity[]>([])
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const { navigate } = useCustomNavigate()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { tenant } = useDashboardContext()
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )
  const { getLegalEntities, deleteLegalEntity } = useCustomerManagementApi()
  const [isLoading, setIsLoading] = useState(true)
  const { showSuccess, showError } = useToast()
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    setVisibleColumns(fetchTableConfiguration(TABLE_NAME_CONFIG_KEY))
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [tableConfigurations])

  // A host tenant switch drops rows and selection from the previous tenant.
  useEffect(() => {
    setTableData([])
    setSelected([])
  }, [tenant])

  useEffect(() => {
    setIsLoading(true)
    void loadLatest(
      trackRequest,
      () => getLegalEntities(paginationParams),
      ({ values, totalRecords }) => {
        setTableData(values)
        setTotalCount(totalRecords)
        setIsLoading(false)
      },
      (e) => {
        showError(t('companies.toasts.errorLoad'), getApiErrorDetails(e))
        console.error('Error fetching legal entities:', e)
        setIsLoading(false)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, paginationParams, refresh, tenant])

  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      blockPanel(true)
      await Promise.all(selected.map((le) => deleteLegalEntity(le.id)))
      setSelected([])
      setRefreshValue()
      showSuccess(t('companies.toast.delete.title'))
    } catch (e: unknown) {
      showError(t('companies.toasts.errorDelete'), getApiErrorDetails(e))
      console.error('Error during batch delete:', e)
    } finally {
      blockPanel(false)
      setIsDeleting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, selected, deleteLegalEntity])

  const actionsTemplate = useCallback(
    (rowData: LegalEntity) => (
      <LegalEntityActions
        managerPermissions={canManage}
        legalEntity={rowData}
      />
    ),
    [canManage]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () =>
      parseTableColumns(
        baseColumns.map(({ defaultHidden: _defaultHidden, ...column }) => {
          void _defaultHidden
          return column
        }),
        withDefaultVisibility(baseColumns, visibleColumns),
        visibleMixins,
        getUiLangValue,
        setFilters,
        {
          columnKey: 'actions',
          headerClassName: styles.actionsCell,
          body: actionsTemplate,
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFilters is stable in effect
    [
      baseColumns,
      visibleColumns,
      visibleMixins,
      getUiLangValue,
      actionsTemplate,
    ]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={batchDelete}
          isDeleting={isDeleting}
          pluralsPath="companies"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={baseColumns.map((column) => column.columnKey ?? '')}
          tableColumnHeaders={baseColumns.map((column) =>
            String(column.header ?? '')
          )}
          tableName={TABLE_NAME}
          schemaType={SchemaType.COMPANY}
          managerPermission={canManage}
          defaultHiddenColumns={baseColumns
            .filter((column) => column.defaultHidden)
            .map((column) => column.columnKey ?? '')}
        />
      </div>
      <DataTable
        data-testid="companies-table"
        dataKey="id"
        value={tableData}
        columns={columns}
        loading={isLoading}
        selection={selected}
        selectionMode="multiple"
        onSelectionChange={(selection: unknown) =>
          setSelected(selection as LegalEntity[])
        }
        onRowClick={(row) =>
          navigate(companyDetailPath((row as LegalEntity).id))
        }
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        lazy={true}
        onSort={onSortCallback}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
      />
    </div>
  )
}

export default CompaniesTable
