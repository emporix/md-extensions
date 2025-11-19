import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { Timeline } from 'primereact/timeline'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { AppState } from '../../types/common'
import { BasePage } from '../shared/BasePage'
import { SeverityBadge } from '../shared'
import { useSessionFlow } from '../../hooks/useSessionFlow'
import { LogService } from '../../services/logService'
import '../../styles/components/SessionFlowPage.css'

interface SessionFlowPageProps {
  appState: AppState
}

const SessionFlowPage: React.FC<SessionFlowPageProps> = ({ appState }) => {
  const { t } = useTranslation()
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [agentId, setAgentId] = useState<string | undefined>()
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isControlExpanded, setIsControlExpanded] = useState(false)
  const { flows, loading, error, fetchBySessionId } = useSessionFlow(appState)
  const logService = useMemo(() => new LogService(appState), [appState])

  useEffect(() => {
    // Get agentId from URL parameters
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    setAgentId(agentIdParam || undefined)
  }, [location.search])

  useEffect(() => {
    // Fetch session flow data
    if (sessionId) {
      fetchBySessionId(sessionId)
    }
  }, [fetchBySessionId, sessionId])

  // Initialize selected agents when flows change (all selected by default)
  useEffect(() => {
    if (flows.length > 0) {
      const allMessages = flows.flatMap((flow) => flow.nodes)
      const uniqueAgents = new Set(allMessages.map((msg) => msg.agentId))
      setSelectedAgents(uniqueAgents)
    }
  }, [flows])

  const handleBackToLogs = () => {
    // Navigate back to sessions tab with agentId if available
    const queryParams = agentId ? `?agentId=${agentId}` : ''
    navigate(`/logs/sessions${queryParams}`)
  }

  const handleFlowLogClick = async (
    requestId: string,
    messageTimestamp?: string
  ) => {
    // Store the message timestamp for scrolling to specific message
    if (messageTimestamp) {
      sessionStorage.setItem('scrollToMessage', messageTimestamp)
    }

    try {
      // Navigate to log details page
      const log = await logService.getRequestLogs(requestId)
      if (log?.id) {
        navigate(`/logs/requests/${log.id}`)
      }
    } catch (error) {
      console.error('Error fetching log details:', error)
    }
  }

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(agentId)) {
        newSet.delete(agentId)
      } else {
        newSet.add(agentId)
      }
      return newSet
    })
  }

  // Assign colors to agents
  const agentColors = useMemo(() => {
    if (flows.length === 0) return new Map<string, string>()

    const allMessages = flows.flatMap((flow) => flow.nodes)
    const groups = new Map<string, any[]>()
    allMessages.forEach((message) => {
      const key = message.agentId
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(message)
    })

    const colors = [
      '#e3f2fd', // Light blue
      '#e8f5e8', // Light green
      '#fff3e0', // Light orange
      '#f1f8e9', // Light lime
      '#e0f2f1', // Light teal
      '#fff8e1', // Light yellow
      '#f0f4ff', // Light indigo
      '#f8f9fa', // Light gray
      '#bbdefb', // Darker blue
      '#e1bee7', // Darker purple
      '#c8e6c9', // Darker green
      '#dcedc8', // Darker lime
      '#b2dfdb', // Darker teal
      '#fff59d', // Darker yellow
      '#c5cae9', // Darker indigo
    ]

    const groupColors = new Map<string, string>()
    let colorIndex = 0
    groups.forEach((_, key) => {
      groupColors.set(key, colors[colorIndex % colors.length])
      colorIndex++
    })

    return groupColors
  }, [flows])

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    if (flows.length === 0) return []

    const allMessages = flows.flatMap((flow) => flow.nodes)
    const stats = new Map<string, { count: number; firstTimestamp: string }>()

    allMessages.forEach((message) => {
      const existing = stats.get(message.agentId)
      if (existing) {
        existing.count += 1
        // Keep the earliest timestamp
        if (new Date(message.timestamp) < new Date(existing.firstTimestamp)) {
          existing.firstTimestamp = message.timestamp
        }
      } else {
        stats.set(message.agentId, {
          count: 1,
          firstTimestamp: message.timestamp,
        })
      }
    })

    return Array.from(stats.entries())
      .map(([agentId, data]) => ({
        agentId,
        count: data.count,
        firstTimestamp: data.firstTimestamp,
        color: agentColors.get(agentId) || '#e5e7eb',
      }))
      .sort(
        (a, b) =>
          new Date(a.firstTimestamp).getTime() -
          new Date(b.firstTimestamp).getTime()
      )
  }, [flows, agentColors])

  // Filter agents based on search term
  const filteredAgentStats = useMemo(() => {
    if (!searchTerm) return agentStats
    return agentStats.filter((stat) =>
      stat.agentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [agentStats, searchTerm])

  const items = useMemo(() => {
    if (flows.length === 0) return []

    // Merge all messages from all flows
    const allMessages = flows.flatMap((flow) => flow.nodes)

    // Filter messages by selected agents
    const filteredMessages = allMessages.filter((message) =>
      selectedAgents.has(message.agentId)
    )

    // Sort messages by timestamp and assign colors
    const sortedMessages = filteredMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return sortedMessages.map((message) => ({
      status: message.severity,
      date: new Date(message.timestamp).toLocaleString(),
      message: message.message,
      agentId: message.agentId,
      agentColor: agentColors.get(message.agentId),
      logId: message.id,
      messageTimestamp: message.timestamp,
    }))
  }, [flows, selectedAgents, agentColors])

  return (
    <BasePage
      loading={loading}
      error={error}
      title={`${t('session', 'Session')} - ${sessionId}`}
      backButtonLabel={t('back_to_sessions', 'Back to Sessions')}
      onBack={handleBackToLogs}
      className="session-flow"
    >
      <div className="session-flow-container">
        {/* Agent Filter Control Panel - Collapsed Tab */}
        {!isControlExpanded && (
          <div
            className="agent-filter-collapsed"
            onClick={() => setIsControlExpanded(true)}
          >
            <i className="pi pi-filter agent-filter-collapsed-icon"></i>
            <div className="agent-filter-collapsed-text">
              {t('agent_filter', 'Agent Filter')}
            </div>
            <span className="agent-filter-collapsed-badge">
              {selectedAgents.size}
            </span>
          </div>
        )}

        {/* Agent Filter Control Panel - Expanded */}
        {isControlExpanded && (
          <div className="agent-filter-expanded">
            <div className="agent-filter-header">
              <div className="agent-filter-title-container">
                <i className="pi pi-filter agent-filter-title-icon"></i>
                <h3 className="agent-filter-title">
                  {t('agent_filter', 'Agent Filter')}
                </h3>
              </div>
              <Button
                icon="pi pi-times"
                onClick={() => setIsControlExpanded(false)}
                className="p-button-text p-button-rounded agent-filter-close-button"
              />
            </div>

            <div className="p-input-icon-left mb-3">
              <i className="pi pi-search" />
              <InputText
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search_agents', 'Search agents...')}
                className="agent-filter-search"
              />
            </div>

            <div className="agent-filter-stats-header">
              <span className="agent-filter-stats-label">
                {t('agents', 'Agents')}
              </span>
              <span className="agent-filter-stats-badge">
                {selectedAgents.size} {t('of', 'of')} {agentStats.length}
              </span>
            </div>

            <div className="agent-filter-list">
              {filteredAgentStats.map((stat) => (
                <div
                  key={stat.agentId}
                  className={`agent-filter-item ${selectedAgents.has(stat.agentId) ? 'selected' : ''}`}
                  onClick={() => handleAgentToggle(stat.agentId)}
                >
                  <div className="agent-filter-item-content">
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <Checkbox
                        checked={selectedAgents.has(stat.agentId)}
                        onChange={() => handleAgentToggle(stat.agentId)}
                      />
                    </span>
                    <span className="agent-filter-item-name">
                      {stat.agentId}
                    </span>
                  </div>
                  <div className="agent-filter-item-right">
                    <span className="agent-filter-item-count">
                      {stat.count}
                    </span>
                    <span
                      className="agent-filter-item-color agent-color-badge"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Content */}
        <div className="session-flow-timeline-container">
          <div className="session-flow-timeline-wrapper">
            {loading ? (
              <div className="loading-state">
                <i className="pi pi-spin pi-spinner loading-spinner"></i>
                <div>{t('loading_logs', 'Loading logs...')}</div>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <i className="pi pi-calendar empty-state-icon"></i>
                <div>
                  {selectedAgents.size === 0
                    ? t('no_agents_selected', 'No agents selected')
                    : t('no_logs_found', 'No logs found')}
                </div>
              </div>
            ) : (
              <Timeline
                value={items}
                content={(item) => (
                  <div
                    className="timeline-item timeline-item-interactive"
                    style={{
                      background: item.agentColor || '#fff',
                      borderLeft: `4px solid ${item.agentColor ? 'rgba(0,0,0,0.1)' : '#e5e7eb'}`,
                    }}
                    onClick={() =>
                      handleFlowLogClick(item.logId, item.messageTimestamp)
                    }
                  >
                    <div className="timeline-header">
                      <strong>
                        {item.date} ({item.agentId})
                      </strong>
                      <SeverityBadge severity={item.status} />
                    </div>
                    <div className="timeline-message">{item.message}</div>
                  </div>
                )}
                marker={(item) => (
                  <div
                    className="timeline-marker timeline-marker-dynamic"
                    style={{
                      backgroundColor: item.agentColor || '#e5e7eb',
                      color: item.agentColor || '#e5e7eb',
                    }}
                  />
                )}
                opposite={() => null}
              />
            )}
          </div>
        </div>
      </div>
    </BasePage>
  )
}

export default SessionFlowPage
