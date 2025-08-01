import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolsList } from './tools/ToolsList';
import { ToolsForm } from './tools/ToolsForm';
import { NativeTool } from '../../types/Agent';

interface ToolsManagerProps {
  tools: NativeTool[];
  onChange: (tools: NativeTool[]) => void;
}

export const ToolsManager: React.FC<ToolsManagerProps> = ({ tools, onChange }) => {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);

  const handleAddTool = useCallback((tool: NativeTool) => {
    onChange([...tools, tool]);
    setShowAddForm(false);
  }, [tools, onChange]);

  const handleDeleteTool = useCallback((index: number) => {
    const newTools = tools.filter((_, idx) => idx !== index);
    onChange(newTools);
  }, [tools, onChange]);

  const handleUpdateTool = useCallback((index: number, tool: NativeTool) => {
    const newTools = [...tools];
    newTools[index] = tool;
    onChange(newTools);
    setEditingIndex(undefined);
  }, [tools, onChange]);

  const handleEditTool = useCallback((index: number, _tool: NativeTool) => {
    setEditingIndex(index);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(undefined);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
  }, []);

  return (
    <div className="tools-section">
      <div className="tools-header">
        <h3 className="tools-title">{t('tools', 'Tools')}</h3>
        <button
          className="tools-add-btn"
          onClick={() => setShowAddForm(true)}
          type="button"
          aria-label={t('add_tool', 'Add Tool')}
        >
          <i className="pi pi-plus"></i>
        </button>
      </div>

      <ToolsList
        tools={tools}
        onDelete={handleDeleteTool}
        onEdit={handleEditTool}
        onUpdate={handleUpdateTool}
        onCancelEdit={handleCancelEdit}
        editingIndex={editingIndex}
      />

      {showAddForm && (
        <ToolsForm
          onAdd={handleAddTool}
          onCancel={handleCancelAdd}
        />
      )}
    </div>
  );
}; 