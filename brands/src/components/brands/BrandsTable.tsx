import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { deleteBrand, fetchBrands } from '@emporix/api-calls'
import {
  DataTable,
  useToast,
  type DataTablePaginationState,
} from '@emporix/component-library'

import { getApiErrorDetails, makeCall } from '../../helpers/api'
import { toApiPagination } from '../../helpers/apiPagination'
import type { Brand } from '../../models/Brand.model'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import useBrandsTableColumns from '../../hooks/useBrandsTableColumns'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination, { type PaginationProps } from '../../hooks/usePagination'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { brandDetailPath } from '../../constants/paths'
import styles from './BrandsTable.module.scss'

/** Configuration key the column-visibility preference is stored under. */
const CONFIGURATION_KEY = 'ext_brands'

const BrandsTable = () => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useBrandsTableColumns()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.BRANDS_MANAGER)
  const { fetchVisibleColumns } = useConfiguration()

  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination()
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { currentPage, rows, sortField, sortOrder, filters } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  const loadBrands = useCallback(
    async (params: Partial<PaginationProps>) => {
      try {
        const { values, totalRecords } = await makeCall(
          () => fetchBrands(toApiPagination(params)),
          setIsLoading
        )
        setBrands(values)
        setTotalCount(totalRecords)
      } catch (e: unknown) {
        showError(t('brands.toasts.errorFetch'), getApiErrorDetails(e))
      }
    },
    [showError, t]
  )

  useEffect(() => {
    void loadBrands(paginationParams)
    // Depend on pagination field values (not the paginationParams object) so
    // updates that don't change these fields don't trigger a refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, currentPage, rows, sortField, sortOrder, filtersKey])

  const deleteBrands = async (toDelete: Brand[]) => {
    setIsLoading(true)
    setIsDeleting(true)
    let remaining = [...toDelete]

    for (const brand of toDelete) {
      try {
        await deleteBrand(brand)
        remaining = remaining.filter((b) => b.id !== brand.id)
        showSuccess(t('brands.toasts.successDelete', { name: brand.name }))
      } catch (e: unknown) {
        showError(t('brands.toasts.errorDelete'), getApiErrorDetails(e))
      }
    }

    setSelectedBrands(remaining)
    setIsDeleting(false)
    setIsLoading(false)
    setRefreshValue()
  }

  const openBrand = (brand: Brand) => {
    if (!brand.id) {
      return
    }
    navigate(brandDetailPath(brand.id), {
      query: { backTo: `${location.pathname}${location.search}` },
    })
  }

  const tableActionsTemplate = useCallback(
    (brand: Brand) => (
      <TableActions
        managerPermission={canManage}
        onEdit={() => openBrand(brand)}
        onDelete={() => deleteBrands([brand])}
        deleteConfirm={{ pluralsPath: 'brands', entity: brand }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  const visibleColumns = fetchVisibleColumns(CONFIGURATION_KEY)

  // An empty preference means "never configured" — show every column.
  const shownColumns = useMemo(
    () =>
      visibleColumns.length === 0
        ? columns
        : columns.filter(
            (column) => column.field && visibleColumns.includes(column.field)
          ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, visibleColumns.join(',')]
  )

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selectedBrands}
          onDelete={() => deleteBrands(selectedBrands)}
          isDeleting={isDeleting}
          pluralsPath="brands"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={CONFIGURATION_KEY}
          tableColumns={columns.map((column) => column.field ?? '')}
          tableName="brands.table.columns"
          managerPermission={canManage}
        />
      </div>
      <DataTable
        dataKey="id"
        value={brands}
        selection={selectedBrands}
        onSelectionChange={(selection) =>
          setSelectedBrands(selection as Brand[])
        }
        pagination={pagination}
        lazy={true}
        loading={isLoading}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        columns={shownColumns}
        selectionMode="multiple"
        rowActions={tableActionsTemplate}
        onRowClick={openBrand}
        emptyTemplate={t('brands.noBrands')}
      />
    </>
  )
}

export default BrandsTable
