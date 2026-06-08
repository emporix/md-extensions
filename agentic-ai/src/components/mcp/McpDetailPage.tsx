import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { McpServer } from '../../types/Mcp'
import { useAppState } from '../../contexts/AppStateContext'
import { getMcpServers } from '../../services/mcpService'
import { createEmptyMcpServer } from '../../utils/mcpHelpers'
import { useMcpConfig } from '../../hooks/useMcpConfig'
import { useAgentTokensCatalog } from '../../hooks/useAgentTokensCatalog'
import { McpGeneralSection } from './McpGeneralSection'
import { McpConnectionSection } from './McpConnectionSection'
import { McpDetailSection } from './McpDetailSection'
import { DetailStatusDot } from '../shared/DetailStatusDot'

const McpDetailPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { mcpServerId } = useParams<{ mcpServerId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [mcpServer, setMcpServer] = useState<McpServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { tokens: catalogTokens, loading: tokensLoading } =
    useAgentTokensCatalog()

  useEffect(() => {
    if (isCreating) {
      setMcpServer(createEmptyMcpServer())
      setError(null)
      setLoading(false)
      return
    }

    if (!mcpServerId) {
      setError(t('mcp_server_not_found'))
      setMcpServer(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const servers = await getMcpServers(appState)
        if (cancelled) return

        const foundServer = servers.find((item) => item.id === mcpServerId)
        if (!foundServer) {
          setError(t('mcp_server_not_found'))
          setMcpServer(null)
          return
        }

        setMcpServer(foundServer)
      } catch {
        if (!cancelled) {
          setError(t('error_loading_mcp_server'))
          setMcpServer(null)
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
  }, [appState, isCreating, mcpServerId, t])

  const handleNavigateBack = useCallback(() => {
    navigate('/mcp')
  }, [navigate])

  const handleSaveSuccess = useCallback(() => {
    navigate('/mcp')
  }, [navigate])

  const { state, saving, updateField, handleSave, isFormValid } = useMcpConfig({
    mcpServer,
    isCreating,
    onSave: handleSaveSuccess,
  })

  const mcpServerDisplayName = useMemo(() => {
    if (state.mcpServerName.trim()) {
      return state.mcpServerName
    }
    return isCreating
      ? t('new_mcp_server')
      : state.mcpServerId || t('new_mcp_server')
  }, [isCreating, state.mcpServerId, state.mcpServerName, t])

  if (loading) {
    return (
      <div className="mcp-detail-page">
        <div className="mcp-detail-loading">
          <ProgressSpinner />
          <p>{t('loading_mcp_servers')}</p>
        </div>
      </div>
    )
  }

  if (error || !mcpServer) {
    return (
      <div className="mcp-detail-page">
        <div className="mcp-detail-sticky-header">
          <div className="mcp-detail-header">
            <div className="mcp-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_mcp_servers')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <span className="mcp-detail-title-label">{t('mcp_server')}</span>
            </div>
          </div>
        </div>
        <Message
          severity="error"
          text={error ?? t('mcp_server_not_found')}
          className="mcp-detail-error-message"
        />
      </div>
    )
  }

  return (
    <div className="mcp-detail-page">
      <div className="mcp-detail-sticky-header">
        <div className="mcp-detail-header">
          <div className="mcp-detail-header-main">
            <div className="mcp-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_mcp_servers')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <h1 className="mcp-detail-title">
                <span className="mcp-detail-title-text">
                  <span className="mcp-detail-title-prefix">
                    {t('mcp_server')}{' '}
                  </span>
                  <span className="mcp-detail-title-name">
                    {mcpServerDisplayName}
                  </span>
                </span>
                <DetailStatusDot enabled={mcpServer.enabled ?? true} />
              </h1>
            </div>
            <p className="mcp-detail-subtitle">{t('mcp_detail_subtitle')}</p>
          </div>
          <div className="mcp-detail-header-right">
            <Button
              type="button"
              label={t('save')}
              className="mcp-detail-save-btn"
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
              loading={saving}
            />
          </div>
        </div>
      </div>

      <div className="mcp-detail-content">
        <McpDetailSection titleKey="general">
          <McpGeneralSection
            mcpServerId={state.mcpServerId}
            mcpServerName={state.mcpServerName}
            isEditing={!isCreating && !!mcpServer.id}
            onFieldChange={updateField}
          />
        </McpDetailSection>
        <McpDetailSection titleKey="connection">
          <McpConnectionSection
            url={state.url}
            transport={state.transport}
            authorizationHeaderName={state.authorizationHeaderName}
            authorizationHeaderToken={state.authorizationHeaderToken}
            tokens={catalogTokens}
            tokensLoading={tokensLoading}
            onFieldChange={updateField}
          />
        </McpDetailSection>
      </div>
    </div>
  )
}

export default McpDetailPage
