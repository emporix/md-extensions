import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { CustomAgent } from '../types/Agent';
import { AppState } from '../types/common';
import { IconPicker } from './common/IconPicker';
import { TagPicker } from './common/TagPicker';
import { McpServerManager } from './common/McpServerManager';
import { ToolsManager } from './common/ToolsManager';
<<<<<<< Updated upstream
=======
import { AgentCollaborationManager } from './common/AgentCollaborationManager';
>>>>>>> Stashed changes
import { AgentHeader } from './agent-config/AgentHeader';
import { AgentBasicInfo } from './agent-config/AgentBasicInfo';
import { LlmConfigSection } from './agent-config/LlmConfigSection';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { usePanelAnimation } from '../hooks/usePanelAnimation';

interface AgentConfigPanelProps {
  visible: boolean;
  agent: CustomAgent | null;
  onHide: () => void;
  onSave: (agent: CustomAgent) => void;
  appState: AppState;
<<<<<<< Updated upstream
=======
  availableAgents: CustomAgent[];
>>>>>>> Stashed changes
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ 
  visible, 
  agent, 
  onHide, 
  onSave, 
<<<<<<< Updated upstream
  appState 
=======
  appState,
  availableAgents 
>>>>>>> Stashed changes
}) => {
  const { t } = useTranslation();
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [showTagPicker, setShowTagPicker] = React.useState(false);

  const { state, saving, updateField, handleSave, isFormValid } = useAgentConfig({
    agent,
    appState,
    onSave,
    onHide
  });

  const { isVisible, isClosing, handleClose, handleBackdropClick } = usePanelAnimation({
    visible,
    onHide
  });

  if (!isVisible) return null;

  const handleFieldChange = (field: string, value: string | boolean) => {
    updateField(field as any, value);
  };

  return (
    <>
      <div 
        className={`agent-config-backdrop ${!isClosing ? 'backdrop-visible' : ''}`}
        onClick={handleBackdropClick} 
      />
      
      <div className="agent-config-panel">
        <AgentHeader
          agentName={state.agentName}
          selectedIcon={state.selectedIcon}
          selectedTag={state.tags.length > 0 ? state.tags[0] : null}
          onIconClick={() => setShowIconPicker(true)}
          onTagClick={() => setShowTagPicker(true)}
        />
        
        <div className="agent-config-content">
          <AgentBasicInfo
            agentId={state.agentId}
            agentName={state.agentName}
            description={state.description}
            triggerType={state.triggerType}
            prompt={state.prompt}
            isEditing={!!agent?.id}
            onFieldChange={handleFieldChange}
          />

          <McpServerManager 
            mcpServers={state.mcpServers}
            onMcpServersChange={(servers) => updateField('mcpServers', servers)}
          />

<<<<<<< Updated upstream
          <ToolsManager
            tools={state.nativeTools}
            onChange={(tools) => updateField('nativeTools', tools)}
          />
=======
                <ToolsManager
        tools={state.nativeTools}
        onChange={(tools) => updateField('nativeTools', tools)}
      />
      <AgentCollaborationManager
        collaborations={state.agentCollaborations}
        onChange={(collaborations) => updateField('agentCollaborations', collaborations)}
        availableAgents={availableAgents}
      />
>>>>>>> Stashed changes

          <LlmConfigSection
            model={state.model}
            temperature={state.temperature}
            maxTokens={state.maxTokens}
            provider={state.provider}
            apiKey={state.apiKey}
            recursionLimit={state.recursionLimit}
            enableMemory={state.enableMemory}
            isEditing={!!agent?.id}
            onFieldChange={handleFieldChange}
          />

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
              disabled={saving || !isFormValid} 
            />
          </div>
        </div>
      </div>

              <IconPicker
          visible={showIconPicker}
          selectedIcon={state.selectedIcon}
          onIconSelect={(icon) => updateField('selectedIcon', icon)}
          onClose={() => setShowIconPicker(false)}
        />
        
        <TagPicker
          visible={showTagPicker}
          selectedTag={state.tags.length > 0 ? state.tags[0] : null}
          onTagSelect={(tag) => updateField('tags', tag ? [tag] : [])}
          onClose={() => setShowTagPicker(false)}
        />
      </>
    );
  };

export default AgentConfigPanel; 