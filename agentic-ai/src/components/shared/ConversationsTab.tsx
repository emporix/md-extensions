import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  DataTable,
  DataTableFilterMeta,
  DataTablePFSEvent,
} from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Message } from 'primereact/message'
import { FilterMatchMode } from 'primereact/api'
import { CustomAgent } from '../../types/Agent'
import { Conversation } from '../../types/Conversation'
import {
  formatConversationTimestamp,
  resolveConversationLabel,
} from '../../utils/conversationsHelpers'
import { getLocalizedValue } from '../../utils/agentHelpers'
import { useAppState } from '../../contexts/AppStateContext'
import { useConversations } from '../../hooks/useConversations'
import DateFilterTemplate from './DateFilterTemplate'
import {
  convertFiltersToApi,
  handleDataTablePage,
  handleDataTableSort,
} from '../../utils/dataTableHelpers'

interface ConversationsTabProps {
  agents: CustomAgent[]
  toolId?: string
  agentId?: string
  enabled?: boolean
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
  agents,
  toolId,
  agentId,
  enabled = true,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const appState = useAppState()
  const {
    conversations,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    updateFilters,
    changePage,
    changePageSize,
    sortConversations,
  } = useConversations({ toolId, agentId, enabled })

  const [sortField, setSortField] = useState<string>('lastMessageAt')
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const fetchStartedRef = useRef(false)
  const [conversationFilters, setConversationFilters] =
    useState<DataTableFilterMeta>({
      conversationName: { value: null, matchMode: FilterMatchMode.CONTAINS },
      agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
      lastMessageAt: { value: null, matchMode: FilterMatchMode.CONTAINS },
      sessionId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

  const agentNameById = useMemo(() => {
    return agents.reduce<Record<string, string>>((acc, agent) => {
      acc[agent.id] = getLocalizedValue(agent.name, appState.contentLanguage)
      return acc
    }, {})
  }, [agents, appState.contentLanguage])

  const resolveAgentName = useCallback(
    (resolvedAgentId?: string) => {
      if (!resolvedAgentId?.trim()) {
        return t('not_available')
      }
      return agentNameById[resolvedAgentId] ?? resolvedAgentId
    },
    [agentNameById, t]
  )

  const handleRowClick = useCallback(
    (conversation: Conversation) => {
      if (!conversation.sessionId?.trim()) {
        return
      }

      const resolvedAgentId = conversation.agentId?.trim()
      const queryString = resolvedAgentId
        ? `?agentId=${encodeURIComponent(resolvedAgentId)}`
        : ''
      navigate(`/logs/sessions/${conversation.sessionId}${queryString}`)
    },
    [navigate]
  )

  const handleFilterChange = useCallback((event: DataTablePFSEvent) => {
    setConversationFilters(event.filters as DataTableFilterMeta)
  }, [])

  const handlePageChange = useCallback(
    (event: DataTablePFSEvent) => {
      const [action, value] = handleDataTablePage(event, pageSize)
      if (action === 'pageSize') {
        changePageSize(value)
      } else {
        changePage(value)
      }
    },
    [changePage, changePageSize, pageSize]
  )

  const handleSort = useCallback(
    (event: DataTablePFSEvent) => {
      const fieldMapping: Record<string, string> = {
        conversationName: 'conversationName',
        agentId: 'agentId',
        lastMessageAt: 'lastMessageAt',
        sessionId: 'sessionId',
      }

      const [apiField, apiOrder, newSortField, newSortOrder] =
        handleDataTableSort(event, sortField, sortOrder, fieldMapping)

      setSortField(newSortField)
      setSortOrder(newSortOrder)
      sortConversations(apiField, apiOrder)
    },
    [sortConversations, sortField, sortOrder]
  )

  const dateFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => (
      <DateFilterTemplate options={options} />
    ),
    []
  )

  useEffect(() => {
    const apiFilters = convertFiltersToApi(
      conversationFilters,
      undefined,
      undefined,
      ['lastMessageAt']
    )

    updateFilters(apiFilters)
  }, [conversationFilters, updateFilters])

  useEffect(() => {
    setHasLoadedOnce(false)
    fetchStartedRef.current = false
  }, [toolId, agentId, enabled])

  useEffect(() => {
    if (loading) {
      fetchStartedRef.current = true
      return
    }

    if (fetchStartedRef.current) {
      setHasLoadedOnce(true)
    }
  }, [loading])

  const conversationBody = useCallback(
    (conversation: Conversation) => resolveConversationLabel(conversation),
    []
  )

  const agentBody = useCallback(
    (conversation: Conversation) => resolveAgentName(conversation.agentId),
    [resolveAgentName]
  )

  const lastActivityBody = useCallback(
    (conversation: Conversation) =>
      formatConversationTimestamp(
        conversation.lastMessageAt,
        t('not_available')
      ),
    [t]
  )

  const sessionBody = useCallback(
    (conversation: Conversation) =>
      conversation.sessionId?.trim()
        ? conversation.sessionId
        : t('not_available'),
    [t]
  )

  if (!hasLoadedOnce && loading) {
    return (
      <div className="unified-logs-section">
        <div className="logs-loading loading-state">
          <ProgressSpinner />
          <span className="icon-with-text">{t('loading_conversations')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="unified-logs-section">
        <Message severity="error" text={t('error_loading_conversations')} />
      </div>
    )
  }

  const firstIndex = Math.max(0, (pageNumber - 1) * pageSize)

  return (
    <div className="unified-logs-section">
      <div className="unified-logs-table conversations-table-container">
        <DataTable
          value={conversations}
          emptyMessage={t('no_conversations_found_with_filters')}
          className="unified-logs-datatable conversations-datatable"
          onRowClick={(event) => handleRowClick(event.data as Conversation)}
          rowClassName={(rowData) =>
            (rowData as Conversation).sessionId?.trim()
              ? 'conversations-datatable-row-clickable'
              : ''
          }
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={conversationFilters}
          onFilter={handleFilterChange}
          filterDisplay="row"
          lazy
          paginator={conversations.length > 0 || totalRecords > 0}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          first={firstIndex}
          rows={pageSize}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          currentPageReportTemplate={t(
            'global.pagination',
            'Showing {first} to {last} of {totalRecords} entries'
          )}
        >
          <Column
            field="conversationName"
            header={t('conversation_name')}
            body={conversationBody}
            headerClassName="col-xl"
            bodyClassName="col-xl"
            filterHeaderClassName="col-xl"
            sortable
            filter
            filterPlaceholder={t('filter_by_conversation_name')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="agentId"
            header={t('agent')}
            body={agentBody}
            headerClassName="col-agent"
            bodyClassName="col-agent"
            filterHeaderClassName="col-agent"
            sortable
            filter
            filterPlaceholder={t('filter_by_agent_id')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="lastMessageAt"
            header={t('last_activity')}
            body={lastActivityBody}
            headerClassName="col-timestamp"
            bodyClassName="col-timestamp"
            filterHeaderClassName="col-timestamp"
            sortable
            filter
            filterElement={dateFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="sessionId"
            header={t('session')}
            body={sessionBody}
            headerClassName="col-xl"
            bodyClassName="col-xl text-mono"
            filterHeaderClassName="col-xl"
            sortable
            filter
            filterPlaceholder={t('filter_by_session_id')}
            showFilterMenu={false}
            showClearButton={false}
          />
        </DataTable>
      </div>
    </div>
  )
}
