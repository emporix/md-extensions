import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Tool, ToolConfigPanelProps } from '../../types/Tool';
import { ToolsService } from '../../services/toolsService';
import { useToast } from '../../contexts/ToastContext';
import { BaseConfigPanel } from '../shared/BaseConfigPanel';
import { faTools } from '@fortawesome/free-solid-svg-icons';

const ToolConfigPanel: React.FC<ToolConfigPanelProps> = ({ 
  visible, 
  tool, 
  onHide, 
  onSave, 
  appState 
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [toolId, setToolId] = useState('');
  const [toolName, setToolName] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tool) {
      setToolId(tool.id || '');
      setToolName(tool.name);
      setConfig({ ...tool.config });
    }
  }, [tool]);

  const handleSave = async () => {
    if (!tool) return;

    setSaving(true);
    try {
      const updatedTool: Tool = {
        ...tool,
        id: toolId,
        name: toolName,
        config,
      };

      const toolsService = new ToolsService(appState);
      const savedTool = await toolsService.updateTool(updatedTool);
      
      showSuccess(t('tool_updated_successfully', 'Tool updated successfully!'));
      onSave(savedTool);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save tool';
      showError(`${t('error_saving_tool', 'Error saving tool')}: ${errorMessage}`);
      console.error('Error saving tool:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderConfigFields = () => {
    if (!tool) return null;

    switch (tool.type) {
      case 'slack':
        return (
          <>
            <div className="form-field">
              <label className="field-label">{t('team_id', 'Team ID')}</label>
              <InputText
                value={config.teamId || ''}
                onChange={(e) => updateConfig('teamId', e.target.value)}
                className="w-full"
                placeholder={t('enter_team_id', 'Enter team ID')}
              />
            </div>
            <div className="form-field">
              <label className="field-label">{t('bot_token', 'Bot Token')}</label>
              <InputText
                value={config.botToken || ''}
                onChange={(e) => updateConfig('botToken', e.target.value)}
                className="w-full"
                placeholder={t('enter_bot_token', 'Enter bot token')}
                type="password"
              />
            </div>
          </>
        );
      
      case 'teams':
        return (
          <>
            <div className="form-field">
              <label className="field-label">{t('team_id', 'Team ID')}</label>
              <InputText
                value={config.teamId || ''}
                onChange={(e) => updateConfig('teamId', e.target.value)}
                className="w-full"
                placeholder={t('enter_team_id', 'Enter team ID')}
              />
            </div>
            <div className="form-field">
              <label className="field-label">{t('bot_token', 'Bot Token')}</label>
              <InputText
                value={config.botToken || ''}
                onChange={(e) => updateConfig('botToken', e.target.value)}
                className="w-full"
                placeholder={t('enter_bot_token', 'Enter bot token')}
                type="password"
              />
            </div>
          </>
        );
      
      default:
        return (
          <div className="form-field">
            <label className="field-label">{t('configuration', 'Configuration')}</label>
            <pre className="config-json">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const canSave = !saving && !!toolName.trim() && (!!tool?.id || !!toolId.trim());

  return (
    <BaseConfigPanel
      visible={visible}
      onHide={onHide}
      title={t('tool_configuration', 'Tool Configuration')}
      icon={faTools}
      iconName={toolName}
      onSave={handleSave}
      saving={saving}
      canSave={canSave}
      className="tool-config-panel"
    >
      <div className="form-field">
        <label className="field-label">{t('tool_id', 'Tool ID')}</label>
        <InputText
          value={toolId}
          onChange={(e) => setToolId(e.target.value)}
          className="w-full"
          disabled={!!tool?.id}
          placeholder={t('enter_tool_id', 'Enter tool ID')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('tool_name', 'Tool Name')}</label>
        <InputText
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          className="w-full"
          placeholder={t('enter_tool_name', 'Enter tool name')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('tool_type', 'Tool Type')}</label>
        <InputText
          value={tool?.type || ''}
          className="w-full"
          disabled
        />
      </div>

      {renderConfigFields()}
    </BaseConfigPanel>
  );
};

export default ToolConfigPanel;
