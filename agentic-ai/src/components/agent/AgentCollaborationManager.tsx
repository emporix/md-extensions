import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentCollaborationList } from './agent-collaboration/AgentCollaborationList';
import { AgentCollaborationForm } from './agent-collaboration/AgentCollaborationForm';
import { AgentCollaboration } from '../../types/Agent';
import { CustomAgent } from '../../types/Agent';
import { getLocalizedValue } from '../../utils/agentHelpers';

interface AgentCollaborationManagerProps {
  collaborations: AgentCollaboration[];
  onChange: (collaborations: AgentCollaboration[]) => void;
  availableAgents: CustomAgent[];
  currentAgentId?: string;
}

export const AgentCollaborationManager: React.FC<AgentCollaborationManagerProps> = ({ 
  collaborations, 
  onChange, 
  availableAgents,
  currentAgentId 
}) => {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);

  const filteredAgents = (currentAgentId 
    ? availableAgents.filter(agent => agent.id !== currentAgentId)
    : availableAgents
  ).sort((a, b) => {
    const nameA = getLocalizedValue(a.name).toLowerCase();
    const nameB = getLocalizedValue(b.name).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const handleAddCollaboration = useCallback((collaboration: AgentCollaboration) => {
    onChange([...collaborations, collaboration]);
    setShowAddForm(false);
  }, [collaborations, onChange]);

  const handleDeleteCollaboration = useCallback((index: number) => {
    const newCollaborations = collaborations.filter((_, idx) => idx !== index);
    onChange(newCollaborations);
  }, [collaborations, onChange]);

  const handleUpdateCollaboration = useCallback((index: number, collaboration: AgentCollaboration) => {
    const newCollaborations = [...collaborations];
    newCollaborations[index] = collaboration;
    onChange(newCollaborations);
    setEditingIndex(undefined);
  }, [collaborations, onChange]);

  const handleEditCollaboration = useCallback((index: number, _collaboration: AgentCollaboration) => {
    setEditingIndex(index);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(undefined);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
  }, []);

  return (
    <div className="agent-collaboration-section">
      <div className="agent-collaboration-header">
        <h3 className="agent-collaboration-title">{t('agent_collaboration', 'Agent Collaboration')}</h3>
        <button
          className="agent-collaboration-add-btn"
          onClick={() => setShowAddForm(true)}
          type="button"
          aria-label={t('add_collaboration', 'Add Collaboration')}
        >
          <i className="pi pi-plus"></i>
        </button>
      </div>

      <AgentCollaborationList
        collaborations={collaborations}
        onDelete={handleDeleteCollaboration}
        onEdit={handleEditCollaboration}
        onUpdate={handleUpdateCollaboration}
        onCancelEdit={handleCancelEdit}
        editingIndex={editingIndex}
        availableAgents={filteredAgents}
      />

      {showAddForm && (
        <AgentCollaborationForm
          onAdd={handleAddCollaboration}
          onCancel={handleCancelAdd}
          availableAgents={filteredAgents}
        />
      )}
    </div>
  );
}; 