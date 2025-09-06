import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { McpConfigPanelProps, McpServer } from '../../types/Mcp';
import { BaseConfigPanel } from '../shared/BaseConfigPanel';
import { faServer } from '@fortawesome/free-solid-svg-icons';

const McpConfigPanel: React.FC<McpConfigPanelProps> = ({ 
  visible, 
  mcpServer, 
  onHide, 
  onSave 
}) => {
  const { t } = useTranslation();
  const [mcpServerId, setMcpServerId] = useState('');
  const [mcpServerName, setMcpServerName] = useState('');
  const [transport, setTransport] = useState('sse');
  const [url, setUrl] = useState('');
  const [authorizationHeaderName, setAuthorizationHeaderName] = useState('');
  const [authorizationHeaderTokenId, setAuthorizationHeaderTokenId] = useState('');


  const transportOptions = [
    { label: 'Server-Sent Events (SSE)', value: 'sse' }
  ];

  useEffect(() => {
    if (mcpServer) {
      setMcpServerId(mcpServer.id || '');
      setMcpServerName(mcpServer.name);
      setTransport(mcpServer.transport);
      setUrl(mcpServer.config.url);
      setAuthorizationHeaderName(mcpServer.config.authorizationHeaderName || '');
      setAuthorizationHeaderTokenId(mcpServer.config.authorizationHeaderTokenId || '');
    }
  }, [mcpServer]);

  const handleSave = async () => {
    if (!mcpServer) return;

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
    };

    // Let the parent handle the save operation
    onSave(updatedMcpServer);
  };

  const canSave = !!mcpServerName.trim() && !!url.trim() && (!!mcpServer?.id || !!mcpServerId.trim());

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
        <label className="field-label">{t('mcp_server_id', 'MCP Server ID')}</label>
        <InputText
          value={mcpServerId}
          onChange={(e) => setMcpServerId(e.target.value)}
          className="w-full"
          disabled={!!mcpServer?.id}
          placeholder={t('enter_mcp_server_id', 'Enter MCP server ID')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('mcp_server_name', 'MCP Server Name')}</label>
        <InputText
          value={mcpServerName}
          onChange={(e) => setMcpServerName(e.target.value)}
          className="w-full"
          placeholder={t('enter_mcp_server_name', 'Enter MCP server name')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('transport', 'Transport')}</label>
        <Dropdown
          value={transport}
          options={transportOptions}
          onChange={(e) => setTransport(e.value)}
          className="w-full"
          placeholder={t('select_transport', 'Select transport')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('url', 'URL')}</label>
        <InputText
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
          placeholder={t('enter_url', 'Enter URL')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('authorization_header_name', 'Authorization Header Name')} ({t('optional', 'Optional')})</label>
        <InputText
          value={authorizationHeaderName}
          onChange={(e) => setAuthorizationHeaderName(e.target.value)}
          className="w-full"
          placeholder={t('enter_authorization_header_name', 'Enter authorization header name')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('authorization_header_token_id', 'Authorization Header Token ID')} ({t('optional', 'Optional')})</label>
        <InputText
          value={authorizationHeaderTokenId}
          onChange={(e) => setAuthorizationHeaderTokenId(e.target.value)}
          className="w-full"
          placeholder={t('enter_authorization_header_token_id', 'Enter authorization header token ID')}
        />
      </div>
    </BaseConfigPanel>
  );
};

export default McpConfigPanel;
