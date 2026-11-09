import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import type { Coupon } from '@emporix/api-calls'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import usePagination from '../../hooks/usePagination'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useCouponsApi } from '../../hooks/api/coupons'
import useCouponsColumns, {
  TABLE_COLUMNS_PATH,
} from '../../hooks/useCouponsColumns'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { StylableProps } from '../../helpers/props'
import { parseTableColumns } from '../../helpers/tables'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { SchemaType } from '../../models/Schema.model'
import { couponDetailPath } from '../../constants/paths'
import {
  getPageAfterEmptyResult,
  summarizeCouponDeletes,
} from '../../helpers/couponsTable.helpers'
import styles from './CouponsTable.module.scss'

export const TABLE_KEY = 'ext_coupons'

const CouponsTable = ({ className = '' }: StylableProps) => {
  const { t } = useTranslation()
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useCouponsColumns()
  const { showSuccess, showError } = useToast()
  const { canManage } = useCouponPermissions()
  const { tenant } = useDashboardContext()
  const {
    paginationParams,
    setPaginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
    setFilters,
  } = usePagination()
  const { syncCoupons, deleteCoupon } = useCouponsApi()
  const { navigate } = useCustomNavigate()
  const { tableConfigurations, fetchTableConfiguration, getTableMixinColumns } =
    useConfiguration()
  const { getUiLangValue } = useLocalizedValue()

  const [data, setData] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCoupons, setSelectedCoupons] = useState<Coupon[]>([])
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>([])
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_KEY)
  )
  const requestIdRef = useRef(0)

  useEffect(() => {
    setVisibleColumns(fetchTableConfiguration(TABLE_KEY))
    setVisibleMixins(getTableMixinColumns(TABLE_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [tableConfigurations])

  // A host tenant switch drops rows and selection from the previous tenant.
  useEffect(() => {
    setData([])
    setSelectedCoupons([])
  }, [tenant])

  useEffect(() => {
    void loadCoupons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [refresh, paginationParams, tenant])

  const loadCoupons = async () => {
    const requestId = ++requestIdRef.current
    try {
      setIsLoading(true)
      const { values, totalRecords } = await syncCoupons(paginationParams)
      if (requestId !== requestIdRef.current) return
      const page = getPageAfterEmptyResult(
        paginationParams.currentPage,
        paginationParams.rows,
        values.length,
        totalRecords
      )
      if (page !== null) {
        setPaginationParams((prev) => ({
          ...prev,
          currentPage: page,
          first: (page - 1) * (prev.rows ?? 10),
        }))
        return
      }
      setData(values)
      setTotalCount(totalRecords)
    } catch (e: unknown) {
      if (requestId !== requestIdRef.current) return
      console.error(e)
      showError(t('coupons.toast.fetchError'))
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }

  const deleteCoupons = async (coupons: Coupon[]) => {
    setIsDeleting(true)
    const codes = coupons.map((coupon) => coupon.code)
    const results = await Promise.allSettled(
      codes.map((code) => deleteCoupon(code))
    )
    const { deleted, failed } = summarizeCouponDeletes(codes, results)
    // One toast only: two toasts shown in the same tick replace each other.
    if (failed.length > 0) {
      showError(
        t('coupons.toast.deleteError', {
          codes: failed.map((failure) => failure.code).join(', '),
        }),
        [
          ...failed
            .filter((failure) => failure.message)
            .map((failure) => `${failure.code}: ${failure.message}`),
          ...(deleted.length > 0
            ? [t('coupons.toast.deletedCodes', { codes: deleted.join(', ') })]
            : []),
        ].join('; ')
      )
    } else if (deleted.length > 0) {
      showSuccess(
        deleted.length === 1
          ? t('coupons.toast.deleteSuccess')
          : t('coupons.edit.toast.successBatchDelete')
      )
    }
    const deletedCodes = new Set(deleted)
    setSelectedCoupons((prev) =>
      prev.filter((coupon) => !deletedCodes.has(coupon.code))
    )
    setIsDeleting(false)
    setRefreshValue()
  }

  const navigateToCoupon = (coupon: Coupon) => {
    navigate(couponDetailPath(coupon.code))
  }

  const actionsTemplate = useCallback(
    (coupon: Coupon) => (
      <TableActions
        onEdit={() => navigateToCoupon(coupon)}
        onDelete={() => deleteCoupons([coupon])}
        deleteConfirm={{
          pluralsPath: 'coupons',
          entity: coupon,
          entityLabel: coupon.code,
        }}
        managerPermission={canManage}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [canManage, deleteCoupon]
  )

  const columnsToDisplay: DataTableColumnProps[] = useMemo(
    () =>
      parseTableColumns(
        columns,
        visibleColumns,
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
    [columns, visibleColumns, visibleMixins, getUiLangValue, actionsTemplate]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          isDeleting={isDeleting}
          disabled={!canManage || isLoading}
          selected={selectedCoupons}
          pluralsPath="coupons"
          onDelete={() => deleteCoupons(selectedCoupons)}
        />
        <TableExtensions
          tableConfigurationKey={TABLE_KEY}
          tableColumns={columns.map((column) => String(column.columnKey ?? ''))}
          tableColumnHeaders={columns.map((column) =>
            String(column.header ?? '')
          )}
          tableName={TABLE_COLUMNS_PATH}
          schemaType={SchemaType.COUPON}
          managerPermission={canManage}
        />
      </div>
      <DataTable
        data-testid="coupons-table"
        dataKey="code"
        value={data}
        columns={columnsToDisplay}
        lazy={true}
        loading={isLoading}
        selection={selectedCoupons}
        selectionMode="multiple"
        onSelectionChange={(selection: unknown) =>
          setSelectedCoupons(selection as Coupon[])
        }
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onRowClick={(row) => navigateToCoupon(row as Coupon)}
      />
    </div>
  )
}

export default CouponsTable
