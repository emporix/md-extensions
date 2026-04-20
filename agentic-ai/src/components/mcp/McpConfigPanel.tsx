import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import {
  CustomMcpServerTransportType,
  McpConfigPanelProps,
  McpServerUpsert,
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
  const [authorizationHeaderToken, setAuthorizationHeaderToken] =
    useState('')
  const [tokens, setTokens] = useState<Token[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)

  const transportOptions = useMemo(
    () => [
      {
        label: t('mcp_transport_sse'),
        value: CustomMcpServerTransportType.SSE,
      },
      {
        label: t('mcp_transport_streamable_http'),
        value: CustomMcpServerTransportType.STREAMABLE_HTTP,
      },
    ],
    [t]
  )

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
      setAuthorizationHeaderToken(
        mcpServer.config.authorizationHeaderToken?.id ?? ''
      )
    }
  }, [mcpServer])

  const tokenOptions = tokens.map((token) => ({
    label: token.name,
    value: token.id,
  }))

  const handleSave = async () => {
    if (!mcpServer) return

    const updatedMcpServer: McpServerUpsert = {
      ...mcpServer,
      id: mcpServerId,
      name: mcpServerName,
      transport,
      config: {
        url,
        authorizationHeaderName: authorizationHeaderName || undefined,
        authorizationHeaderToken: authorizationHeaderToken || undefined,
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
      title={t('mcp_server_configuration')}
      icon={faServer}
      iconName={mcpServerName}
      onSave={handleSave}
      canSave={canSave}
      className="mcp-config-panel"
    >
      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_id')}
          {!mcpServer?.id && (
            <span className="field-required-mark"> *</span>
          )}
        </label>
        <InputText
          value={mcpServerId}
          onChange={(e) => setMcpServerId(sanitizeIdInput(e.target.value))}
          className={`w-full ${!mcpServer?.id && !mcpServerId.trim() ? 'p-invalid' : ''}`}
          disabled={!!mcpServer?.id}
          placeholder={t('enter_mcp_server_id')}
        />
        {!mcpServer?.id && !mcpServerId.trim() && (
          <small className="p-error">
            {t('mcp_server_id_required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_name')}
          <span className="field-required-mark"> *</span>
        </label>
        <InputText
          value={mcpServerName}
          onChange={(e) => setMcpServerName(e.target.value)}
          className={`w-full ${!mcpServerName.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_mcp_server_name')}
        />
        {!mcpServerName.trim() && (
          <small className="p-error">
            {t('mcp_server_name_required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">{t('transport')}</label>
        <Dropdown
          value={transport}
          options={transportOptions}
          onChange={(e) => setTransport(e.value)}
          className="w-full"
          placeholder={t('select_transport')}
          appendTo="self"
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('url')}
          <span className="field-required-mark"> *</span>
        </label>
        <InputText
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={`w-full ${!url.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_url')}
        />
        {!url.trim() && (
          <small className="p-error">
            {t('url_required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('authorization_header_name')} ({t('optional')})
        </label>
        <InputText
          value={authorizationHeaderName}
          onChange={(e) => setAuthorizationHeaderName(e.target.value)}
          className="w-full"
          placeholder={t('enter_authorization_header_name')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('authorization_header_token_id')} ({t('optional')})
        </label>
        <Dropdown
          value={authorizationHeaderToken}
          options={tokenOptions}
          onChange={(e) => setAuthorizationHeaderToken(e.value)}
          className="w-full"
          placeholder={
            tokensLoading ? t('loading_tokens') : t('select_token')
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
