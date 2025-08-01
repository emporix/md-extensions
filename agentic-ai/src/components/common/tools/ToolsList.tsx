import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeTool } from '../../../types/Agent';
import { ToolsForm } from './ToolsForm';

interface ToolsListProps {
  tools: NativeTool[];
  onDelete: (index: number) => void;
  onEdit: (index: number, tool: NativeTool) => void;
  onUpdate: (index: number, tool: NativeTool) => void;
  onCancelEdit: () => void;
  editingIndex?: number;
}

export const ToolsList: React.FC<ToolsListProps> = ({ 
  tools, 
  onDelete, 
  onEdit, 
  onUpdate, 
  onCancelEdit, 
  editingIndex 
}) => {
  const { t } = useTranslation();

  if (tools.length === 0) {
    return null;
  }

  return (
    <div className="tools-list">
      {tools.map((tool, idx) => (
        <div className="tool-row" key={idx}>
          {editingIndex === idx ? (
            <ToolsForm
              onAdd={(updatedTool: NativeTool) => onUpdate(idx, updatedTool)}
              onCancel={onCancelEdit}
              editingTool={tool}
            />
          ) : (
            <>
              <div className="tool-row-top">
                <span className="tool-type">
                  {tool.type === 'slack' ? 'Slack' : 'Microsoft Teams'}
                </span>
                <div className="tool-actions">
                  <button 
                    className="tool-edit-btn" 
                    type="button" 
                    aria-label={t('edit', 'Edit')} 
                    onClick={() => onEdit(idx, tool)}
                  >
                    <i className="pi pi-pencil"></i>
                  </button>
                  <button 
                    className="tool-delete-btn" 
                    type="button" 
                    aria-label={t('delete', 'Delete')} 
                    onClick={() => onDelete(idx)}
                  >
                    <i className="pi pi-trash"></i>
                  </button>
                </div>
              </div>
              <div className="tool-divider" />
              <div className="tool-details">
                <div className="tool-status">
                  <span className={`tool-status-badge ${tool.enabled ? 'enabled' : 'disabled'}`}>
                    {tool.enabled ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                  </span>
                </div>
                {tool.type === 'slack' && tool.config && (
                  <div className="tool-config">
                    <div className="config-item">
                      <span className="config-label">{t('team_id', 'Team ID')}:</span>
                      <span className="config-value">{tool.config.teamId}</span>
                    </div>
                    <div className="config-item">
                      <span className="config-label">{t('bot_token', 'Bot Token')}:</span>
                      <span className="config-value">••••••••</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}; 