import React from 'react';
import { useTranslation } from 'react-i18next';
import { McpServer } from '../../../types/Agent';
import { McpServer as ManagedMcpServer } from '../../../types/Mcp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faCog } from '@fortawesome/free-solid-svg-icons';
import { MCP_SERVERS, McpKey } from '../../../utils/constants';

interface McpServersListProps {
  mcpServers: McpServer[];
  availableMcpServers: ManagedMcpServer[];
  onDelete: (index: number) => void;
}

export const McpServersList: React.FC<McpServersListProps> = ({ 
  mcpServers, 
  availableMcpServers,
  onDelete
}) => {
  const { t } = useTranslation();

  if (mcpServers.length === 0) {
    return null;
  }

  const getMcpServerDisplayInfo = (mcpServer: McpServer) => {
    if (mcpServer.type === 'predefined' && mcpServer.domain) {
      const predefinedServer = MCP_SERVERS[mcpServer.domain as McpKey];
      return {
        name: predefinedServer?.name || mcpServer.domain,
        icon: faServer,
        type: 'predefined',
        details: `${mcpServer.tools?.length || 0} tools selected`,
        enabled: true
      };
    } else if (mcpServer.type === 'custom' && mcpServer.mcpServer?.id) {
      const customServer = availableMcpServers.find(s => s.id === mcpServer.mcpServer!.id);
      return {
        name: customServer?.name || mcpServer.mcpServer!.id,
        icon: faServer,
        type: 'custom',
        details: customServer?.config.url || 'Custom MCP Server',
        enabled: customServer?.enabled !== false
      };
    }
    
    return {
      name: 'Unknown Server',
      icon: faCog,
      type: 'unknown',
      details: 'Invalid configuration',
      enabled: false
    };
  };

  return (
    <div className="mcp-servers-list">
      {mcpServers.map((mcpServer, idx) => {
        const serverInfo = getMcpServerDisplayInfo(mcpServer);
        const isDisabled = !serverInfo.enabled;
        
        return (
          <div 
            className={`mcp-server-row ${isDisabled ? 'mcp-server-disabled' : ''}`}
            key={idx}
            title={isDisabled ? t('mcp_server_disabled', 'This MCP server is currently disabled') : undefined}
          >
            <div className="mcp-server-row-top">
              <div className="mcp-server-info">
                <div className="mcp-server-agent">
                  <FontAwesomeIcon 
                    icon={serverInfo.icon} 
                    className="mcp-server-icon" 
                  />
                  <span className="mcp-server-name">
                    {serverInfo.name}
                    {isDisabled && <span style={{ marginLeft: '8px', fontSize: '0.85em', color: '#f44336' }}>(Disabled)</span>}
                  </span>
                </div>
              </div>
              <div className="mcp-server-actions">
                <button 
                  className="mcp-server-delete-btn" 
                  type="button" 
                  aria-label={t('delete', 'Delete')} 
                  onClick={() => onDelete(idx)}
                >
                  <i className="pi pi-trash"></i>
                </button>
              </div>
            </div>
            <div className="mcp-server-divider" />
            <div className="mcp-server-details">
              <div className="mcp-server-config">
                <span className="mcp-server-type-badge">
                  {serverInfo.type === 'predefined' ? t('emporix', 'Emporix') : t('custom', 'Custom')}
                </span>
                <span className="mcp-server-details-text">
                  {serverInfo.details}
                </span>
              </div>
              {mcpServer.type === 'predefined' && mcpServer.tools && (
                <div className="mcp-server-tools">
                  {mcpServer.tools.map((tool: string) => (
                    <span className="mcp-server-tool-chip" key={tool}>{tool}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
