import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  FilterMatchMode,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'

import {
  createRequestTracker,
  getApiErrorDetails,
  makeCall,
} from '../../helpers/api'
import type { Unit } from '../../models/Unit.model'
import { useUnitsApi } from '../../hooks/api/units'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination from '../../hooks/usePagination'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import { EmployeeDomains } from '../../configs/accessControls'
import { unitDetailPath } from '../../constants/paths'
import styles from './UnitsTable.module.scss'

const COLUMNS = 'units.table.columns'

// MD `numericColumn`: right-aligned with 12px padding.
const NUMERIC_COLUMN: Partial<DataTableColumnProps> = {
  align: 'right',
  bodyStyle: { paddingRight: '12px' },
  headerStyle: { paddingRight: '12px' },
  dataType: 'numeric',
}

const textFilter = (field: string): Partial<DataTableColumnProps> => ({
  filter: true,
  filterField: field,
  filterMatchMode: FilterMatchMode.CONTAINS,
  showFilterMenu: false,
  showClearButton: false,
})

/**
 * Lazy table like MD: the service pages and filters (code, name in the
 * content language, symbol, type); it does not sort.
 */
const UnitsTable = () => {
  const { t, i18n } = useTranslation()
  const { showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.UNITS_MANAGER)
  const { tenant } = useDashboardContext()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { getUnitsPage, deleteUnit } = useUnitsApi()

  const { paginationParams, onPageCallback, onFilterCallback } = usePagination()
  const { currentPage, rows, filters } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  const [units, setUnits] = useState<Unit[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selected, setSelected] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // Rows and selection belong to the previous tenant; batch delete must not
    // send their codes to the new one.
    setSelected([])
    setUnits([])
  }, [tenant])

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest request may fill the table.
    const isLatest = trackRequest()
    makeCall(
      () => getUnitsPage(paginationParams),
      (loading: boolean) => {
        if (isLatest()) setIsLoading(loading)
      }
    )
      .then(({ values, totalRecords }) => {
        if (!isLatest()) return
        setUnits(values)
        setTotalCount(totalRecords)
      })
      .catch((e: unknown) => {
        if (!isLatest()) return
        setUnits([])
        setTotalCount(0)
        showError(t('units.toasts.errorFetch'), getApiErrorDetails(e))
      })
    // Depend on the pagination values, not the paginationParams object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refresh, currentPage, rows, filtersKey])

  const deleteUnits = useCallback(
    async (toDelete: Unit[]) => {
      setIsDeleting(true)
      blockPanel(true)
      try {
        // In parallel, as MD did; a failed code gets its own toast.
        const results = await Promise.allSettled(
          toDelete.map((unit) => deleteUnit(unit.code))
        )
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            showError(
              t('units.toasts.errorDelete', { code: toDelete[index].code }),
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
    [blockPanel, deleteUnit, setRefreshValue, showError, t]
  )

  const openUnit = (unit: Unit) => {
    navigate(unitDetailPath(unit.code))
  }

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'code',
        header: t(`${COLUMNS}.code`),
        field: 'code',
        ...textFilter('code'),
      },
      {
        columnKey: 'name',
        header: t(`${COLUMNS}.name`),
        field: 'name',
        ...textFilter(`name.${contentLanguage}`),
        body: (unit: Unit) => getContentLangValue(unit.name),
      },
      {
        columnKey: 'symbol',
        header: t(`${COLUMNS}.symbol`),
        field: 'symbol',
        ...textFilter('symbol'),
      },
      {
        columnKey: 'type',
        header: t(`${COLUMNS}.type`),
        field: 'type',
        ...textFilter('type'),
      },
      {
        columnKey: 'factor',
        header: t(`${COLUMNS}.factor`),
        field: 'factor',
        ...NUMERIC_COLUMN,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, contentLanguage, t]
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
          onDelete={() => deleteUnits(selected)}
          isDeleting={isDeleting}
          pluralsPath="units"
          disabled={!canManage}
        />
      </div>
      <DataTable
        dataKey="code"
        value={units}
        columns={columns}
        lazy={true}
        loading={isLoading}
        pagination={pagination}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(selection) => setSelected(selection as Unit[])}
        rowActions={(unit: Unit) => (
          <TableActions
            managerPermission={canManage}
            onEdit={() => openUnit(unit)}
            onDelete={() => deleteUnits([unit])}
            deleteConfirm={{ pluralsPath: 'units', entity: unit }}
          />
        )}
        onRowClick={openUnit}
        emptyMessage={t('global.noDataFound')}
        data-testid="units-table"
      />
    </>
  )
}

export default UnitsTable
