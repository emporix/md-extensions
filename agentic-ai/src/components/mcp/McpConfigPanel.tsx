import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import {
  CustomMcpServerTransportType,
  McpConfigPanelProps,
  McpServer,
} from '../../types/Mcp'
import { BaseConfigPanel } from '../shared/BaseConfigPanel'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { Token } from '../../types/Token'
import { getTokens } from '../../services/tokensService'
import { sanitizeIdInput } from '../../utils/validation'

const McpConfigPanel: React.FC<McpConfigPanelProps> = ({
  visible,
  mcpServer,
  onHide,
  onSave,
  appState,
}) => {
  const { t } = useTranslation()
  const [mcpServerId, setMcpServerId] = useState('')
  const [mcpServerName, setMcpServerName] = useState('')
  const [transport, setTransport] = useState(CustomMcpServerTransportType.SSE)
  const [url, setUrl] = useState('')
  const [authorizationHeaderName, setAuthorizationHeaderName] = useState('')
  const [authorizationHeaderTokenId, setAuthorizationHeaderTokenId] =
    useState('')
  const [tokens, setTokens] = useState<Token[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)

  const transportOptions = [
    {
      label: 'Server-Sent Events (SSE)',
      value: CustomMcpServerTransportType.SSE,
    },
    {
      label: 'Streamable HTTP',
      value: CustomMcpServerTransportType.STREAMABLE_HTTP,
    },
  ]

  // Load tokens when component mounts or appState changes
  useEffect(() => {
    const loadTokens = async () => {
      if (!appState) return

      setTokensLoading(true)
      try {
        const fetchedTokens = await getTokens(appState)
        setTokens(fetchedTokens)
      } catch (error) {
        console.error(error)
        setTokens([])
      } finally {
        setTokensLoading(false)
      }
    }

    loadTokens()
  }, [appState])

  useEffect(() => {
    if (mcpServer) {
      setMcpServerId(mcpServer.id || '')
      setMcpServerName(mcpServer.name)
      setTransport(mcpServer.transport)
      setUrl(mcpServer.config.url)
      setAuthorizationHeaderName(mcpServer.config.authorizationHeaderName || '')
      setAuthorizationHeaderTokenId(
        mcpServer.config.authorizationHeaderTokenId || ''
      )
    }
  }, [mcpServer])

  // Create token options for dropdown
  const tokenOptions = tokens.map((token) => ({
    label: token.name,
    value: token.id,
  }))

  const handleSave = async () => {
    if (!mcpServer) return

    const updatedMcpServer: McpServer = {
      ...mcpServer,
      id: mcpServerId,
      name: mcpServerName,
      transport,
      config: {
        url,
        authorizationHeaderName: authorizationHeaderName || undefined,
        authorizationHeaderTokenId: authorizationHeaderTokenId || undefined,
      },
    }

    onSave(updatedMcpServer)
  }

  const canSave =
    !!mcpServerName.trim() &&
    !!url.trim() &&
    (!!mcpServer?.id || !!mcpServerId.trim())

  return (
    <BaseConfigPanel
      visible={visible}
      onHide={onHide}
      title={t('mcp_server_configuration', 'MCP Server Configuration')}
      icon={faServer}
      iconName={mcpServerName}
      onSave={handleSave}
      canSave={canSave}
      className="mcp-config-panel"
    >
      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_id', 'MCP Server ID')}
          {!mcpServer?.id && <span style={{ color: 'red' }}> *</span>}
        </label>
        <InputText
          value={mcpServerId}
          onChange={(e) => setMcpServerId(sanitizeIdInput(e.target.value))}
          className={`w-full ${!mcpServer?.id && !mcpServerId.trim() ? 'p-invalid' : ''}`}
          disabled={!!mcpServer?.id}
          placeholder={t('enter_mcp_server_id', 'Enter MCP server ID')}
        />
        {!mcpServer?.id && !mcpServerId.trim() && (
          <small className="p-error">
            {t('mcp_server_id_required', 'MCP Server ID is required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_name', 'MCP Server Name')}
          <span style={{ color: 'red' }}> *</span>
        </label>
        <InputText
          value={mcpServerName}
          onChange={(e) => setMcpServerName(e.target.value)}
          className={`w-full ${!mcpServerName.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_mcp_server_name', 'Enter MCP server name')}
        />
        {!mcpServerName.trim() && (
          <small className="p-error">
            {t('mcp_server_name_required', 'MCP Server name is required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">{t('transport', 'Transport')}</label>
        <Dropdown
          value={transport}
          options={transportOptions}
          onChange={(e) => setTransport(e.value)}
          className="w-full"
          placeholder={t('select_transport', 'Select transport')}
          appendTo="self"
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('url', 'URL')}
          <span style={{ color: 'red' }}> *</span>
        </label>
        <InputText
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={`w-full ${!url.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_url', 'Enter URL')}
        />
        {!url.trim() && (
          <small className="p-error">
            {t('url_required', 'URL is required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('authorization_header_name', 'Authorization Header Name')} (
          {t('optional', 'Optional')})
        </label>
        <InputText
          value={authorizationHeaderName}
          onChange={(e) => setAuthorizationHeaderName(e.target.value)}
          className="w-full"
          placeholder={t(
            'enter_authorization_header_name',
            'Enter authorization header name'
          )}
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('authorization_header_token_id', 'Authorization Header Token ID')}{' '}
          ({t('optional', 'Optional')})
        </label>
        <Dropdown
          value={authorizationHeaderTokenId}
          options={tokenOptions}
          onChange={(e) => setAuthorizationHeaderTokenId(e.value)}
          className="w-full"
          placeholder={
            tokensLoading
              ? t('loading_tokens', 'Loading tokens...')
              : t('select_token', 'Select token')
          }
          disabled={tokensLoading}
          showClear
          appendTo="self"
        />
      </div>
    </BaseConfigPanel>
  )
}

export default McpConfigPanel
