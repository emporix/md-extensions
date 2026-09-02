import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import {
  CustomMcpServerTransportType,
  ManagedMcpServerType,
  McpServer,
} from '../../types/Mcp'
import { useAppState } from '../../contexts/AppStateContext'
import { getMcpServer } from '../../services/mcpService'
import { getEntityLoadErrorMessage } from '../../utils/errorHelpers'
import {
  createEmptyMcpDraft,
  isDynamicMcpServer,
  switchMcpServerType,
} from '../../utils/mcpHelpers'
import { useMcpConfig } from '../../hooks/useMcpConfig'
import { useDynamicMcpConfig } from '../../hooks/useDynamicMcpConfig'
import { useAgentTokensCatalog } from '../../hooks/useAgentTokensCatalog'
import { useProjectFunctions } from '../../hooks/useProjectFunctions'
import { useIamScopes } from '../../hooks/useIamScopes'
import { useFeatureToggles } from '../../hooks/useFeatureToggles'
import { McpGeneralSection } from './McpGeneralSection'
import { McpConnectionSection } from './McpConnectionSection'
import { McpDetailSection } from './McpDetailSection'
import { McpToolsEditor } from './McpToolsEditor'
import { DetailStatusDot } from '../shared/DetailStatusDot'

const McpDetailPage = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { mcpServerId } = useParams<{ mcpServerId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [mcpServer, setMcpServer] = useState<McpServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isDynamic = isDynamicMcpServer(mcpServer ?? {})
  const mcpServerType = mcpServer?.type ?? ''
  const typeSelected = !!mcpServerType

  const { tokens: catalogTokens, loading: tokensLoading } =
    useAgentTokensCatalog()
  const { toggles, loading: togglesLoading } = useFeatureToggles()
  const {
    functions,
    loading: functionsLoading,
    featureDisabled,
    error: functionsLoadError,
    reload: refreshFunctions,
  } = useProjectFunctions(isDynamic)
  const {
    scopes,
    loading: scopesLoading,
    error: scopesLoadError,
  } = useIamScopes(isDynamic)

  useEffect(() => {
    if (isCreating) {
      setMcpServer(createEmptyMcpDraft())
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
        const fetchedServer = await getMcpServer(appState, mcpServerId)
        if (cancelled) return

        setMcpServer(fetchedServer)
      } catch (err) {
        if (!cancelled) {
          setError(
            getEntityLoadErrorMessage(
              err,
              {
                notFoundKey: 'mcp_server_not_found',
                errorKey: 'error_loading_mcp_server',
              },
              t
            )
          )
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

  const customConfig = useMcpConfig({
    mcpServer: isDynamic ? null : mcpServer,
    isCreating,
    onSave: handleSaveSuccess,
  })

  const dynamicConfig = useDynamicMcpConfig({
    mcpServer: isDynamic ? mcpServer : null,
    isCreating,
    onSave: handleSaveSuccess,
  })

  const handleMcpTypeChange = useCallback(
    (type: ManagedMcpServerType) => {
      if (!isCreating || !mcpServer || mcpServer.type === type) {
        return
      }

      setMcpServer(
        switchMcpServerType(type, {
          id: isDynamic
            ? dynamicConfig.state.mcpServerId
            : customConfig.state.mcpServerId,
          name: isDynamic
            ? dynamicConfig.state.mcpServerName
            : customConfig.state.mcpServerName,
          enabled: mcpServer.enabled,
        })
      )
    },
    [
      customConfig.state.mcpServerId,
      customConfig.state.mcpServerName,
      dynamicConfig.state.mcpServerId,
      dynamicConfig.state.mcpServerName,
      isCreating,
      isDynamic,
      mcpServer,
    ]
  )

  const handleIdChange = useCallback(
    (value: string) => {
      if (isDynamic) {
        dynamicConfig.updateField('mcpServerId', value)
      } else {
        customConfig.updateField('mcpServerId', value)
      }
    },
    [customConfig, dynamicConfig, isDynamic]
  )

  const handleNameChange = useCallback(
    (value: string) => {
      if (isDynamic) {
        dynamicConfig.updateField('mcpServerName', value)
      } else {
        customConfig.updateField('mcpServerName', value)
      }
    },
    [customConfig, dynamicConfig, isDynamic]
  )

  const handleTransportChange = useCallback(
    (value: CustomMcpServerTransportType) => {
      customConfig.updateField('transport', value)
    },
    [customConfig]
  )

  const generalState = isDynamic ? dynamicConfig.state : customConfig.state

  const mcpServerDisplayName = useMemo(() => {
    if (generalState.mcpServerName.trim()) {
      return generalState.mcpServerName
    }
    return isCreating
      ? t('new_mcp_server')
      : generalState.mcpServerId || t('new_mcp_server')
  }, [generalState.mcpServerId, generalState.mcpServerName, isCreating, t])

  const saving = isDynamic ? dynamicConfig.saving : customConfig.saving
  const isFormValid =
    typeSelected &&
    (isDynamic ? dynamicConfig.isFormValid : customConfig.isFormValid)
  const handleSave = isDynamic
    ? dynamicConfig.handleSave
    : customConfig.handleSave

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
            mcpServerId={generalState.mcpServerId}
            mcpServerName={generalState.mcpServerName}
            mcpServerType={mcpServerType}
            transport={
              isCreating || typeSelected
                ? isDynamic
                  ? CustomMcpServerTransportType.STREAMABLE_HTTP
                  : customConfig.state.transport
                : undefined
            }
            isEditing={!isCreating && !!mcpServer.id}
            hostingEnabled={toggles.emporixHosting}
            optionsReady={!togglesLoading}
            transportDisabled={isDynamic}
            onIdChange={handleIdChange}
            onNameChange={handleNameChange}
            onMcpServerTypeChange={handleMcpTypeChange}
            onTransportChange={handleTransportChange}
          />
        </McpDetailSection>

        {typeSelected &&
          (isDynamic ? (
            <McpDetailSection
              titleKey="mcp_tools"
              descriptionKey="mcp_tools_autopopulate_hint"
              plain
            >
              <McpToolsEditor
                tools={dynamicConfig.state.tools}
                isCreating={isCreating}
                functions={functions}
                functionsLoading={functionsLoading}
                functionsLoadError={functionsLoadError}
                featureDisabled={featureDisabled}
                onRefreshFunctions={refreshFunctions}
                scopes={scopes}
                scopesLoading={scopesLoading}
                scopesLoadError={scopesLoadError}
                onToolChange={dynamicConfig.updateTool}
                onAddTool={dynamicConfig.addTool}
                onRemoveTool={dynamicConfig.removeTool}
              />
            </McpDetailSection>
          ) : (
            <McpDetailSection titleKey="connection">
              <McpConnectionSection
                url={customConfig.state.url}
                authorizationHeaderName={
                  customConfig.state.authorizationHeaderName
                }
                authorizationHeaderToken={
                  customConfig.state.authorizationHeaderToken
                }
                tokens={catalogTokens}
                tokensLoading={tokensLoading}
                onFieldChange={customConfig.updateField}
              />
            </McpDetailSection>
          ))}
      </div>
    </div>
  )
}

export default McpDetailPage
