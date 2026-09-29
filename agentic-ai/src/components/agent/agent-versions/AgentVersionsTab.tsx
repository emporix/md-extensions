import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterMatchMode } from 'primereact/api'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import {
  DataTable,
  DataTableFilterMeta,
  DataTablePFSEvent,
} from 'primereact/datatable'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AgentVersionDiffDialog } from './AgentVersionDiffDialog'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import DateFilterTemplate from '../../shared/DateFilterTemplate'
import { useAppState } from '../../../contexts/AppStateContext'
import { useToast } from '../../../contexts/ToastContext'
import {
  getAgentWithVersions,
  upsertCustomAgent,
} from '../../../services/agentService'
import {
  formatApiError,
  getEntityLoadErrorMessage,
} from '../../../utils/errorHelpers'
import { formatTimestamp } from '../../../utils/formatHelpers'
import {
  buildAgentVersionRows,
  buildRollbackAgent,
  formatVersionAuthor,
  type AgentVersionRow,
} from '../../../utils/agentVersionHelpers'
import type { AgentWithVersions } from '../../../types/Agent'

type AgentVersionsTabProps = {
  readonly agentId: string
  readonly onRolledBack?: () => void
}

type VersionTableRow = AgentVersionRow & {
  readonly authorLabel: string
  readonly noteLabel: string
  readonly modifiedAtDate: Date | null
}

const toFilterDate = (modifiedAt: string | undefined): Date | null => {
  if (!modifiedAt) {
    return null
  }

  const date = new Date(modifiedAt)
  return Number.isNaN(date.getTime()) ? null : date
}

const AgentVersionsTab = ({ agentId, onRolledBack }: AgentVersionsTabProps) => {
  const { t } = useTranslation()
  const appState = useAppState()
  const { showSuccess, showError } = useToast()
  const [agent, setAgent] = useState<AgentWithVersions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [compareRow, setCompareRow] = useState<AgentVersionRow | null>(null)
  const [rollbackRow, setRollbackRow] = useState<AgentVersionRow | null>(null)
  const [rollingBack, setRollingBack] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const rollingBackRef = useRef(false)
  const [sortField, setSortField] = useState('version')
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    version: { value: null, matchMode: FilterMatchMode.CONTAINS },
    modifiedAtDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    authorLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
    noteLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  })

  useEffect(() => {
    if (!agentId.trim()) {
      setAgent(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      setCompareRow(null)
      try {
        const fetched = await getAgentWithVersions(appState, agentId)
        if (!cancelled) {
          setAgent(fetched)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setAgent(null)
          setError(
            getEntityLoadErrorMessage(
              err,
              {
                notFoundKey: 'agent_not_found',
                errorKey: 'error_loading_agent_versions',
              },
              t
            )
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [agentId, appState, t, reloadToken])

  const rows = useMemo(() => {
    const versions = agent ? buildAgentVersionRows(agent) : []
    return versions.map((row) => ({
      ...row,
      authorLabel:
        row.modifiedBy?.type === 'EXTERNAL'
          ? t('agent_version_type_external')
          : formatVersionAuthor(row.modifiedBy, t('agent_version_system')) ||
            t('not_available'),
      noteLabel: row.changeNote?.trim() || t('not_available'),
      modifiedAtDate: toFilterDate(row.modifiedAt),
    }))
  }, [agent, t])

  const currentRow = useMemo(
    () => rows.find((row) => row.isCurrent) ?? null,
    [rows]
  )

  const handleFilterChange = useCallback((event: DataTablePFSEvent) => {
    setFilters(event.filters as DataTableFilterMeta)
  }, [])

  const handleSort = useCallback((event: DataTablePFSEvent) => {
    setSortField(event.sortField)
    setSortOrder(event.sortOrder as 1 | -1)
  }, [])

  const handleConfirmRollback = useCallback(async () => {
    if (
      rollingBackRef.current ||
      !rollbackRow ||
      !agent ||
      rollbackRow.isCurrent
    ) {
      return
    }

    const changeNote = t('agent_version_rollback_change_note', {
      version: rollbackRow.version,
    })
    const payload = buildRollbackAgent(agent, rollbackRow, changeNote)
    if (!payload) {
      showError(t('agent_version_rollback_missing_config'))
      return
    }

    rollingBackRef.current = true
    setRollingBack(true)
    try {
      await upsertCustomAgent(appState, payload)
      showSuccess(
        t('agent_version_rollback_success', { version: rollbackRow.version })
      )
      setRollbackRow(null)
      setReloadToken((token) => token + 1)
      onRolledBack?.()
    } catch (err) {
      console.error(err)
      showError(
        formatApiError(
          err,
          t('agent_version_rollback_error', {
            version: rollbackRow.version,
          })
        )
      )
    } finally {
      rollingBackRef.current = false
      setRollingBack(false)
    }
  }, [agent, appState, onRolledBack, rollbackRow, showError, showSuccess, t])

  const versionBody = (row: VersionTableRow) => (
    <div className="log-meta-cell">
      <span>{row.version}</span>
    </div>
  )

  const dateBody = (row: VersionTableRow) => (
    <div className="log-meta-cell">
      {formatTimestamp(row.modifiedAt) || t('not_available')}
    </div>
  )

  const authorBody = (row: VersionTableRow) => (
    <div className="log-meta-cell agent-version-author" title={row.authorLabel}>
      {row.authorLabel}
    </div>
  )

  const noteBody = (row: VersionTableRow) => (
    <div className="log-meta-cell">{row.noteLabel}</div>
  )

  const actionBody = (row: VersionTableRow) => {
    if (row.isCurrent) {
      return (
        <div className="log-meta-cell">
          <span className="base-badge badge-success agent-version-current-badge">
            {t('agent_version_current')}
          </span>
        </div>
      )
    }

    return (
      <div className="log-meta-cell agent-version-actions">
        <Button
          type="button"
          icon="pi pi-arrow-right-arrow-left"
          className="p-button-text p-button-rounded p-button-sm agent-version-action"
          aria-label={t('agent_version_compare')}
          title={t('agent_version_compare')}
          disabled={rollingBack}
          onClick={() => setCompareRow(row)}
        />
        <Button
          type="button"
          icon="pi pi-replay"
          className="p-button-text p-button-rounded p-button-sm agent-version-action"
          aria-label={t('agent_version_rollback')}
          title={t('agent_version_rollback')}
          disabled={rollingBack}
          onClick={() => setRollbackRow(row)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="unified-logs-section">
        <div className="logs-loading loading-state">
          <ProgressSpinner />
          <span className="icon-with-text">{t('loading_agent_versions')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="unified-logs-section">
        <Message severity="error" text={error} />
      </div>
    )
  }

  return (
    <div className="unified-logs-section">
      <div className="unified-logs-table">
        <DataTable
          value={rows}
          dataKey="id"
          className="unified-logs-datatable agent-versions-datatable responsive-datatable"
          responsiveLayout="scroll"
          emptyMessage={t('no_agent_versions_found')}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={filters}
          onFilter={handleFilterChange}
          filterDisplay="row"
          paginator={rows.length > 0}
          rows={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate={t('global.pagination')}
        >
          <Column
            field="version"
            header={t('agent_version_column')}
            body={versionBody}
            className="col-sm"
            sortable
            filter
            filterPlaceholder={t('filter_by_version')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="authorLabel"
            header={t('agent_version_author')}
            body={authorBody}
            className="col-agent"
            sortable
            filter
            filterPlaceholder={t('filter_by_author')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="modifiedAt"
            filterField="modifiedAtDate"
            dataType="date"
            header={t('agent_version_date')}
            body={dateBody}
            className="col-timestamp"
            sortable
            filter
            filterElement={(options) => (
              <DateFilterTemplate options={options} />
            )}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="noteLabel"
            header={t('agent_version_change_note')}
            body={noteBody}
            className="col-change-note"
            sortable
            filter
            filterPlaceholder={t('filter_by_change_note')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            header={t('agent_version_actions')}
            body={actionBody}
            className="col-version-actions"
          />
        </DataTable>
      </div>
      <AgentVersionDiffDialog
        selected={compareRow}
        current={currentRow}
        onHide={() => setCompareRow(null)}
      />
      <ConfirmDialog
        visible={rollbackRow !== null}
        title={t('agent_version_rollback_title', {
          version: rollbackRow?.version ?? '',
        })}
        message={t('agent_version_rollback_message', {
          version: rollbackRow?.version ?? '',
        })}
        confirmLabel={t('agent_version_rollback_confirm')}
        confirmClassName="agent-detail-save-btn"
        cancelLabel={t('cancel')}
        onConfirm={() => {
          void handleConfirmRollback()
        }}
        onHide={() => {
          if (!rollingBack) {
            setRollbackRow(null)
          }
        }}
        severity="warning"
      />
    </div>
  )
}

export { AgentVersionsTab }
