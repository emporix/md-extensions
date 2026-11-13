import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTablePaginationState,
} from '@emporix/component-library'

import {
  createRequestTracker,
  getApiErrorDetails,
  makeCall,
} from '../../helpers/api'
import type { Catalog } from '../../models/Catalog.model'
import { useCatalogsApi } from '../../hooks/api/catalogs'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination from '../../hooks/usePagination'
import useCatalogsTableColumns, {
  CATALOG_COLUMN_KEYS,
  filterVisibleCatalogColumns,
} from '../../hooks/useCatalogsTableColumns'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import { EmployeeDomains } from '../../configs/accessControls'
import { catalogDetailPath } from '../../constants/paths'
import styles from './CatalogsTable.module.scss'

/** Configuration key MD stored the column-visibility preference under. */
export const CATALOGS_TABLE_CONFIG_KEY = 'ext_catalogs'

/** Lazy table like MD: the service pages, sorts and filters. */
const CatalogsTable = () => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATALOGS_MANAGER)
  const { tenant } = useDashboardContext()
  const { fetchVisibleColumns } = useConfiguration()
  const { getCatalogsPage, deleteCatalog } = useCatalogsApi()
  const columns = useCatalogsTableColumns()

  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination()
  const { currentPage, rows, sortField, sortOrder, filters } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selected, setSelected] = useState<Catalog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // Rows and selection belong to the previous tenant; batch delete must not
    // send their ids to the new one.
    setSelected([])
    setCatalogs([])
  }, [tenant])

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest request may fill the table.
    const isLatest = trackRequest()
    makeCall(
      () => getCatalogsPage(paginationParams),
      (loading: boolean) => {
        if (isLatest()) setIsLoading(loading)
      }
    )
      .then(({ values, totalRecords }) => {
        if (!isLatest()) return
        setCatalogs(values)
        setTotalCount(totalRecords)
      })
      .catch((e: unknown) => {
        if (!isLatest()) return
        setCatalogs([])
        setTotalCount(0)
        showError(t('catalogs.toasts.errorFetch'), getApiErrorDetails(e))
      })
    // Depend on the pagination values, not the paginationParams object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refresh, currentPage, rows, sortField, sortOrder, filtersKey])

  const deleteCatalogs = useCallback(
    async (toDelete: Catalog[]) => {
      setIsDeleting(true)
      blockPanel(true)
      try {
        // In parallel, as MD did; a failed id gets its own toast.
        const results = await Promise.allSettled(
          toDelete.map((catalog) => deleteCatalog(catalog.id))
        )
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            showError(
              t('catalogs.toasts.errorDelete', { id: toDelete[index].id }),
              getApiErrorDetails(result.reason)
            )
          }
        })
      } finally {
        blockPanel(false)
        setIsDeleting(false)
        setSelected([])
        setRefreshValue()
      }
    },
    [blockPanel, deleteCatalog, setRefreshValue, showError, t]
  )

  const openCatalog = (catalog: Catalog) => {
    navigate(catalogDetailPath(catalog.id))
  }

  const shownColumns = filterVisibleCatalogColumns(
    columns,
    fetchVisibleColumns(CATALOGS_TABLE_CONFIG_KEY)
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={() => deleteCatalogs(selected)}
          isDeleting={isDeleting}
          pluralsPath="catalogs"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={CATALOGS_TABLE_CONFIG_KEY}
          tableColumns={[...CATALOG_COLUMN_KEYS]}
          tableName="catalogs.table.columns"
          managerPermission={canManage}
        />
      </div>
      <DataTable
        dataKey="id"
        value={catalogs}
        columns={shownColumns}
        lazy={true}
        loading={isLoading}
        pagination={pagination}
        sortField={sortField}
        sortOrder={sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(selection) => setSelected(selection as Catalog[])}
        rowActions={(catalog: Catalog) => (
          <TableActions
            managerPermission={canManage}
            onEdit={() => openCatalog(catalog)}
            onDelete={() => deleteCatalogs([catalog])}
            deleteConfirm={{ pluralsPath: 'catalogs', entity: catalog }}
          />
        )}
        onRowClick={openCatalog}
        emptyMessage={t('global.noDataFound')}
        data-testid="catalogs-table"
      />
    </>
  )
}

export default CatalogsTable
