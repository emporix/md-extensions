import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { AgentCollaboration } from '../../../types/Agent';
import { CustomAgent } from '../../../types/Agent';
import { getLocalizedValue } from '../../../utils/agentHelpers';
import { iconMap } from '../../../utils/agentHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AgentCollaborationFormProps {
  onAdd: (collaboration: AgentCollaboration) => void;
  onCancel: () => void;
  availableAgents: CustomAgent[];
  editingCollaboration?: AgentCollaboration;
}

export const AgentCollaborationForm: React.FC<AgentCollaborationFormProps> = ({ 
  onAdd, 
  onCancel, 
  availableAgents,
  editingCollaboration 
}) => {
  const { t } = useTranslation();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    editingCollaboration?.agentId || null
  );
  const [description, setDescription] = useState(
    editingCollaboration?.description || ''
  );

  const agentOptions = availableAgents.map(agent => ({
    label: (
      <div className="agent-option">
        <FontAwesomeIcon 
          icon={iconMap[agent.icon || 'robot'] || iconMap.robot} 
          className="agent-option-icon" 
        />
        <span>{getLocalizedValue(agent.name)}</span>
      </div>
    ),
    value: agent.id
  }));

  const isFormValid = () => {
    return selectedAgentId && description.trim();
  };

  const handleAdd = () => {
    if (!isFormValid() || !selectedAgentId) return;

    const collaboration: AgentCollaboration = {
      agentId: selectedAgentId,
      description: description.trim()
    };

    onAdd(collaboration);
  };

  return (
    <div className="agent-collaboration-form">
      <div className="form-field">
        <label className="field-label">{t('agent', 'Agent')}</label>
        <Dropdown
          value={selectedAgentId}
          options={agentOptions}
          onChange={(e) => setSelectedAgentId(e.value)}
          placeholder={t('select_agent', 'Select agent')}
          className="w-full"
          appendTo="self"
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('description', 'Description')}</label>
        <InputTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('enter_description', 'Enter description')}
          className="w-full"
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button
          label={t('cancel', 'Cancel')}
          onClick={onCancel}
          className="discard-button"
        />
        <Button
          label={editingCollaboration ? t('update', 'Update') : t('add', 'Add')}
          onClick={handleAdd}
          disabled={!isFormValid()}
          className="save-agent-button"
        />
      </div>
    </div>
  );
}; 