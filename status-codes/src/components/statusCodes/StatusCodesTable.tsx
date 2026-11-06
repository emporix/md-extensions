import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  FilterMatchMode,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'

import { createRequestTracker, getApiErrorDetails } from '../../helpers/api'
import type { QuoteReason } from '../../models/QuoteReason.model'
import { useQuoteReasonsApi } from '../../hooks/api/quoteReasons'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import { EmployeeDomains } from '../../configs/accessControls'
import { statusCodeDetailPath } from '../../constants/paths'
import styles from './StatusCodesTable.module.scss'

const TABLE_NAME = 'quotesReasons.table'

/**
 * Client-side table like MD: the service returns every status code of the
 * tenant in one call, and filter and sort run on the loaded rows.
 */
const StatusCodesTable = () => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.STATUS_CODES_MANAGER)
  const { tenant } = useDashboardContext()
  const { getQuoteReasons, deleteQuoteReason } = useQuoteReasonsApi()

  const [reasons, setReasons] = useState<QuoteReason[]>([])
  const [selected, setSelected] = useState<QuoteReason[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // Rows and selection belong to the previous tenant; batch delete must not
    // send their ids to the new one.
    setSelected([])
    setReasons([])
  }, [tenant])

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest request may fill the table.
    const isLatest = trackRequest()
    setIsLoading(true)
    getQuoteReasons()
      .then((data) => {
        if (isLatest()) setReasons(data)
      })
      .catch((e: unknown) => {
        if (!isLatest()) return
        setReasons([])
        showError(t('quotesReasons.toasts.errorFetch'), getApiErrorDetails(e))
      })
      .finally(() => {
        if (isLatest()) setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refresh])

  const deleteOne = useCallback(
    async (reason: QuoteReason) => {
      blockPanel(true)
      try {
        await deleteQuoteReason(reason.id)
        showSuccess(
          t('quotesReasons.toasts.successDelete', { code: reason.code })
        )
        return true
      } catch (e: unknown) {
        showError(
          t('quotesReasons.toasts.errorDelete', { code: reason.code }),
          getApiErrorDetails(e)
        )
        return false
      } finally {
        blockPanel(false)
      }
    },
    [blockPanel, deleteQuoteReason, showError, showSuccess, t]
  )

  // One after another, a toast per code, as MD did.
  const deleteReasons = async (toDelete: QuoteReason[]) => {
    setIsDeleting(true)
    for (const reason of toDelete) {
      await deleteOne(reason)
    }
    setSelected([])
    setIsDeleting(false)
    setRefreshValue()
  }

  const openReason = (reason: QuoteReason) => {
    navigate(statusCodeDetailPath(reason.id))
  }

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'code',
        header: t(`${TABLE_NAME}.code`),
        field: 'code',
        filter: true,
        filterField: 'code',
        filterMatchMode: FilterMatchMode.CONTAINS,
        filterPlaceholder: t(`${TABLE_NAME}.filters.code`),
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'type',
        header: t(`${TABLE_NAME}.type`),
        field: 'type',
        filter: true,
        filterField: 'type',
        filterMatchMode: FilterMatchMode.CONTAINS,
        filterPlaceholder: t(`${TABLE_NAME}.filters.type`),
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, t]
  )

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={() => deleteReasons(selected)}
          isDeleting={isDeleting}
          pluralsPath="quotesReasons"
          disabled={!canManage}
          singularName={selected[0]?.code}
        />
      </div>
      <DataTable
        dataKey="id"
        value={reasons}
        columns={columns}
        lazy={false}
        loading={isLoading}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(selection) =>
          setSelected(selection as QuoteReason[])
        }
        rowActions={(reason: QuoteReason) => (
          <TableActions
            managerPermission={canManage}
            onEdit={() => openReason(reason)}
            onDelete={() => deleteReasons([reason])}
            deleteConfirm={{
              pluralsPath: 'quotesReasons',
              entityLabel: reason.code,
            }}
          />
        )}
        onRowClick={openReason}
        emptyMessage={t('global.noDataFound')}
        data-testid="status-codes-table"
      />
    </>
  )
}

export default StatusCodesTable
