import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { NativeTool } from '../../../types/Agent';

interface ToolsFormProps {
  onAdd: (tool: NativeTool) => void;
  onCancel: () => void;
  editingTool?: NativeTool;
}

export const ToolsForm: React.FC<ToolsFormProps> = ({ onAdd, onCancel, editingTool }) => {
  const { t } = useTranslation();
  const [toolType, setToolType] = useState<'slack' | 'teams' | null>(
    editingTool?.type || null
  );
  const [teamId, setTeamId] = useState(
    editingTool?.type === 'slack' ? editingTool.config?.teamId || '' : ''
  );
  const [botToken, setBotToken] = useState(
    editingTool?.type === 'slack' ? editingTool.config?.botToken || '' : ''
  );

  const toolOptions = [
    { 
      label: (
        <div className="tool-option">
          <FontAwesomeIcon icon={faSlack} className="tool-icon slack-icon" />
          <span>Slack</span>
        </div>
      ), 
      value: 'slack' 
    },
    { 
      label: (
        <div className="tool-option disabled-option">
          <FontAwesomeIcon icon={faMicrosoft} className="tool-icon teams-icon disabled-icon" />
          <span>Microsoft Teams</span>
          <span className="disabled-text">(Not Available)</span>
        </div>
      ), 
      value: 'teams',
      disabled: true
    }
  ];

  const isFormValid = () => {
    if (!toolType) return false;
    
    if (toolType === 'slack') {
      return teamId.trim() && botToken.trim();
    }
    
    // Teams is disabled, so only Slack is valid
    return false;
  };

  const handleAdd = () => {
    if (!isFormValid() || !toolType || toolType === 'teams') return;

    const tool: NativeTool = {
      type: toolType,
      enabled: true,
      ...(toolType === 'slack' && {
        config: {
          teamId: teamId.trim(),
          botToken: botToken.trim()
        }
      })
    };

    onAdd(tool);
  };

  return (
    <div className="tools-form">
      <div className="form-field">
        <label className="field-label">{t('tool_type', 'Tool Type')}</label>
        <Dropdown
          value={toolType}
          options={toolOptions}
          onChange={(e) => setToolType(e.value)}
          placeholder={t('select_tool_type', 'Select tool type')}
          className="w-full"
        />
      </div>

      {toolType === 'slack' && (
        <>
          <div className="form-field">
            <label className="field-label">{t('team_id', 'Team ID')}</label>
            <InputText
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder={t('enter_team_id', 'Enter team ID')}
              className="w-full"
            />
          </div>
          <div className="form-field">
            <label className="field-label">{t('bot_token', 'Bot Token')}</label>
            <InputText
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={t('enter_bot_token', 'Enter bot token')}
              className="w-full"
              type="password"
            />
          </div>
        </>
      )}

      {toolType === 'teams' && (
        <div className="form-field">
          <p className="tool-not-available">
            {t('teams_not_available', 'Microsoft Teams integration is not yet available')}
          </p>
        </div>
      )}

      <div className="form-actions">
        <Button
          label={t('cancel', 'Cancel')}
          onClick={onCancel}
          className="discard-button"
        />
        <Button
          label={editingTool ? t('update', 'Update') : t('add', 'Add')}
          onClick={handleAdd}
          disabled={!isFormValid()}
          className="save-agent-button"
        />
      </div>
    </div>
  );
}; 