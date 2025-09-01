import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { McpConfigPanelProps, McpServer } from '../types/Mcp';
import { usePanelAnimation } from '../hooks/usePanelAnimation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  const { isVisible, isClosing, handleClose, handleBackdropClick } = usePanelAnimation({
    visible,
    onHide
  });

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

  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`agent-config-backdrop ${!isClosing ? 'backdrop-visible' : ''}`}
        onClick={handleBackdropClick} 
      />
      
      <div className="agent-config-panel mcp-config-panel">
        <div className="agent-config-header">
          <h2 className="panel-title">{t('mcp_server_configuration', 'MCP Server Configuration')}</h2>
        </div>
        
        <div className="agent-config-content">
          <div className="agent-config-icon-row">
            <div className="agent-icon">
              <FontAwesomeIcon icon={faServer} />
            </div>
            <div className="agent-config-name-block">
              <h3 className="agent-config-name">{mcpServerName}</h3>
            </div>
          </div>

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

          <div className="panel-actions">
            <Button 
              label={t('cancel', 'Cancel')} 
              className="discard-button" 
              onClick={handleClose} 
            />
            <Button 
              label={t('save', 'Save')} 
              className="save-agent-button" 
              onClick={handleSave} 
              disabled={!mcpServerName.trim() || !url.trim() || (!mcpServer?.id && !mcpServerId.trim())} 
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default McpConfigPanel;
