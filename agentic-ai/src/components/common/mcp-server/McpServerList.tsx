import React from 'react';
import { useTranslation } from 'react-i18next';
import { MCP_SERVERS, McpKey } from '../../../utils/constants';
import { McpServerForm } from './McpServerForm';

interface McpServer {
  type: 'predefined' | 'custom';
  name?: McpKey | string;
  tools?: string[];
  url?: string;
  transport?: string;
  config?: {
    headers?: Record<string, any>;
  };
}

interface McpServerListProps {
  mcpServers: McpServer[];
  onDelete: (index: number) => void;
  onEdit: (index: number, server: McpServer) => void;
  onUpdate: (index: number, server: McpServer) => void;
  onCancelEdit: () => void;
  editingIndex?: number;
}

export const McpServerList: React.FC<McpServerListProps> = React.memo(({ 
  mcpServers, 
  onDelete,
  onEdit,
  onUpdate,
  onCancelEdit,
  editingIndex
}) => {
  const { t } = useTranslation();

  if (mcpServers.length === 0) {
    return null;
  }

  return (
    <div className="mcp-servers-list">
      {mcpServers.map((server, idx) => (
        <div className="mcp-server-row" key={idx}>
          {editingIndex === idx ? (
            <McpServerForm
              onAdd={(updatedServer) => onUpdate(idx, updatedServer)}
              onCancel={onCancelEdit}
              editingServer={server}
            />
          ) : (
            <>
              <div className="mcp-server-row-top">
                <span className="mcp-server-type">
                  {server.type === 'predefined' ? t('emporix', 'Emporix') : t('custom', 'Custom')}
                </span>
                {server.type === 'predefined' && (
                  <span className="mcp-server-mcp">{MCP_SERVERS[server.name as McpKey]?.name}</span>
                )}
                {server.type === 'custom' && (
                  <span className="mcp-server-custom-name">{server.name}</span>
                )}
                <div className="mcp-server-actions">
                  <button 
                    className="mcp-server-edit-btn" 
                    type="button" 
                    aria-label={t('edit', 'Edit')} 
                    onClick={() => onEdit(idx, server)}
                  >
                    <i className="pi pi-pencil"></i>
                  </button>
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
              {server.type === 'predefined' && (
                <div className="mcp-server-tools">
                  {server.tools?.map((tool: string) => (
                    <span className="mcp-server-tool-chip" key={tool}>{tool}</span>
                  ))}
                </div>
              )}
              {server.type === 'custom' && (
                <div className="mcp-server-custom-details">
                  <div className="mcp-server-custom-url">{server.url}</div>
                  <div className="mcp-server-custom-row">
                    <span className="mcp-server-tool-chip">{server.transport?.toUpperCase()}</span>
                  </div>
                                {server.config?.headers && Object.keys(server.config.headers).length > 0 && (
                <div className="mcp-server-custom-headers">
                  {Object.entries(server.config.headers).map(([key, value]) => (
                    <div key={key} className="header-display">
                      <span className="header-key">{key}:</span>
                      <span className="header-value">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}); 