import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import {
  DataTable,
  useToast,
  type DataTablePaginationState,
} from '@emporix/component-library'

import { fetchLabelsPage } from '../../api/labels'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import {
  deleteLabelWithImage,
  filterVisibleColumns,
} from '../../helpers/labels.helpers'
import type { Label } from '../../models/Label.model'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import useLabelsTableColumns from '../../hooks/useLabelsTableColumns'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination, {
  DEFAULT_PAGINATION_PROPS,
  type PaginationProps,
} from '../../hooks/usePagination'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { labelDetailPath } from '../../constants/paths'
import styles from './LabelsTable.module.scss'

/** Configuration key the column-visibility preference is stored under. */
const CONFIGURATION_KEY = 'ext_labels'

// No initial sort: MD sends none, so labels keep the API's default order.
const INITIAL_PAGINATION: Partial<PaginationProps> = DEFAULT_PAGINATION_PROPS

const LabelsTable = () => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useLabelsTableColumns()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.LABELS_MANAGER)
  const { fetchTableConfiguration } = useConfiguration()

  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination(INITIAL_PAGINATION)
  const [labels, setLabels] = useState<Label[]>([])
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { currentPage, rows, sortField, sortOrder, filters } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  const loadLabels = useCallback(
    async (params: Partial<PaginationProps>) => {
      try {
        const { values, totalRecords } = await makeCall(
          () => fetchLabelsPage(params),
          setIsLoading
        )
        setLabels(values)
        setTotalCount(totalRecords)
      } catch (e: unknown) {
        showError(t('labels.toasts.errorFetch'), getApiErrorDetails(e))
      }
    },
    [showError, t]
  )

  useEffect(() => {
    void loadLabels(paginationParams)
    // Depend on pagination field values (not the paginationParams object) so
    // updates that don't change these fields don't trigger a refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, currentPage, rows, sortField, sortOrder, filtersKey])

  const deleteLabels = async (toDelete: Label[]) => {
    setIsLoading(true)
    setIsDeleting(true)
    let remaining = [...toDelete]

    for (const label of toDelete) {
      try {
        await deleteLabelWithImage(label)
        remaining = remaining.filter((l) => l.id !== label.id)
      } catch (e: unknown) {
        showError(t('labels.toasts.errorDelete'), getApiErrorDetails(e))
      }
    }

    setSelectedLabels(remaining)
    setIsDeleting(false)
    setIsLoading(false)
    setRefreshValue()
  }

  const openLabel = (label: Label) => {
    if (!label.id) {
      return
    }
    navigate(labelDetailPath(label.id), {
      query: { backTo: `${location.pathname}${location.search}` },
    })
  }

  const tableActionsTemplate = (label: Label) => (
    <TableActions
      managerPermission={canManage}
      onEdit={() => openLabel(label)}
      onDelete={() => deleteLabels([label])}
      deleteConfirm={{ pluralsPath: 'labels', entity: label }}
    />
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  const shownColumns = filterVisibleColumns(
    columns,
    fetchTableConfiguration(CONFIGURATION_KEY)
  )

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selectedLabels}
          onDelete={() => deleteLabels(selectedLabels)}
          isDeleting={isDeleting}
          pluralsPath="labels"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={CONFIGURATION_KEY}
          tableColumns={columns.map((column) => column.field ?? '')}
          tableName="labels.table.columns"
          managerPermission={canManage}
        />
      </div>
      <DataTable
        dataKey="id"
        value={labels}
        selection={selectedLabels}
        onSelectionChange={(selection) =>
          setSelectedLabels(selection as Label[])
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
        onRowClick={openLabel}
        emptyTemplate={t('labels.noLabels')}
      />
    </>
  )
}

export default LabelsTable
