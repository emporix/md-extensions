import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeTool } from '../../../types/Agent';
import { Tool } from '../../../types/Tool';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack } from '@fortawesome/free-brands-svg-icons';
import { faCog } from '@fortawesome/free-solid-svg-icons';

interface NativeToolsListProps {
  nativeTools: NativeTool[];
  availableTools: Tool[];
  onDelete: (index: number) => void;
}

export const NativeToolsList: React.FC<NativeToolsListProps> = ({ 
  nativeTools, 
  availableTools,
  onDelete
}) => {
  const { t } = useTranslation();

  if (nativeTools.length === 0) {
    return null;
  }

  const getToolDisplayInfo = (toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    if (!tool) {
      return { name: toolId, icon: faCog, type: 'unknown' };
    }

    const icon = tool.type === 'slack' ? faSlack : faCog;
    
    return {
      name: tool.name,
      icon: icon,
      type: tool.type,
      config: tool.config
    };
  };

  return (
    <div className="native-tools-list">
      {nativeTools.map((nativeTool, idx) => {
        const toolInfo = getToolDisplayInfo(nativeTool.id);
        
        return (
          <div className="native-tool-row" key={idx}>
            <div className="native-tool-row-top">
              <div className="native-tool-info">
                <div className="native-tool-agent">
                  <FontAwesomeIcon 
                    icon={toolInfo.icon} 
                    className="native-tool-icon" 
                  />
                  <span className="native-tool-name">
                    {toolInfo.name}
                  </span>
                </div>
              </div>
              <div className="native-tool-actions">
                <button 
                  className="native-tool-delete-btn" 
                  type="button" 
                  aria-label={t('delete', 'Delete')} 
                  onClick={() => onDelete(idx)}
                >
                  <i className="pi pi-trash"></i>
                </button>
              </div>
            </div>
            <div className="native-tool-divider" />
            <div className="native-tool-details">
              {toolInfo.type === 'slack' && toolInfo.config && (
                <div className="native-tool-config">
                  {toolInfo.config.teamId && (
                    <span className="native-tool-config-chip">Team: {toolInfo.config.teamId}</span>
                  )}
                  {toolInfo.config.botToken && (
                    <span className="native-tool-config-chip">Bot Token: ••••••••</span>
                  )}
                </div>
              )}
              {toolInfo.type !== 'slack' && (
                <div className="native-tool-config">
                  <span className="native-tool-config-chip">{toolInfo.type.toUpperCase()} Tool</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
