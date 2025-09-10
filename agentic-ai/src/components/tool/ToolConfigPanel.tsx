import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
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
  const [slackInstallLoading, setSlackInstallLoading] = useState(false);

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

  const handleSlackInstallation = async () => {
    if (!appState) {
      showError(t('error_app_state_missing', 'Application state is missing'));
      return;
    }

    setSlackInstallLoading(true);
    try {
      const toolsService = new ToolsService(appState);
      const { id: stateId, clientId } = await toolsService.getSlackInstallationData();
      const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=app_mentions:read,channels:history,channels:manage,channels:read,channels:write.invites,chat:write,groups:read,groups:write,users:read,users:read.email&user_scope=&state=${stateId}`;
      window.location.href = slackOAuthUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Slack installation';
      showError(`${t('error_slack_installation', 'Error initiating Slack installation')}: ${errorMessage}`);
      console.error('Error initiating Slack installation:', error);
    } finally {
      setSlackInstallLoading(false);
    }
  };

  const renderSlackConfigFields = () => {
    const isCreating = !tool?.id;

    return (
      <>
        {isCreating && (
          <>
            <div className="slack-install-section">
              <h3 className="section-title">{t('install_emporix_slack_ai', 'Install Emporix Slack AI')}</h3>
              <p className="section-subtitle">{t('slack_install_description', 'Quick setup with one click. Automatically configure your Slack workspace with the necessary permissions.')}</p>
              <div className="slack-install-button-container">
                <Button 
                  onClick={handleSlackInstallation}
                  loading={slackInstallLoading}
                  disabled={slackInstallLoading}
                  className="slack-install-button"
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    borderRadius: '12px'
                  }}
                >
                  <img 
                    alt="Add to Slack" 
                    height="40" 
                    width="139" 
                    src="https://platform.slack-edge.com/img/add_to_slack.png" 
                    srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" 
                    style={{ 
                      borderRadius: '12px',
                      opacity: slackInstallLoading ? 0.6 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  />
                </Button>
              </div>
            </div>

            <div className="form-separator">
              <div className="separator-line"></div>
              <span className="separator-text">{t('or', 'or')}</span>
              <div className="separator-line"></div>
            </div>

            <div className="manual-config-section">
              <h3 className="section-title">{t('provide_values_manually', 'Provide the values manually')}</h3>
              <p className="section-subtitle">{t('manual_config_description', 'Enter your Slack workspace details manually if you prefer custom configuration.')}</p>
            </div>
          </>
        )}
       
        {/* Tool ID and Name fields */}
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
        
        {/* Slack-specific configuration fields */}
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
  };

  const renderConfigFields = () => {
    if (!tool) return null;

    switch (tool.type) {
      case 'slack':
        return renderSlackConfigFields();
      
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
