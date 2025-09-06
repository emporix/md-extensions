import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeTool } from '../../types/Agent';
import { Tool } from '../../types/Tool';
import { ToolsService } from '../../services/toolsService';
import { AppState } from '../../types/common';
import { NativeToolsList } from './native-tools/NativeToolsList';
import { NativeToolForm } from './native-tools/NativeToolForm';

interface NativeToolsSelectorProps {
  nativeTools: NativeTool[];
  onChange: (nativeTools: NativeTool[]) => void;
  appState: AppState;
}

export const NativeToolsSelector: React.FC<NativeToolsSelectorProps> = ({ 
  nativeTools, 
  onChange, 
  appState 
}) => {
  const { t } = useTranslation();
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const loadTools = async () => {
      setToolsLoading(true);
      try {
        const toolsService = new ToolsService(appState);
        const fetchedTools = await toolsService.getTools();
        setAvailableTools(fetchedTools);
      } catch (error) {
        console.error('Error loading tools:', error);
        setAvailableTools([]);
      } finally {
        setToolsLoading(false);
      }
    };

    loadTools();
  }, [appState]);

  const handleAddTool = useCallback((nativeTool: NativeTool) => {
    onChange([...nativeTools, nativeTool]);
    setShowAddForm(false);
  }, [nativeTools, onChange]);

  const handleDeleteTool = useCallback((index: number) => {
    const newNativeTools = nativeTools.filter((_, idx) => idx !== index);
    onChange(newNativeTools);
  }, [nativeTools, onChange]);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const existingToolIds = nativeTools.map(tool => tool.id);

  return (
    <div className="native-tools-section">
      <div className="native-tools-header">
        <h3 className="native-tools-title">{t('native_tools', 'Native Tools')}</h3>
        <button
          className="native-tools-add-btn"
          onClick={() => setShowAddForm(true)}
          type="button"
          aria-label={t('add_tool', 'Add Tool')}
          disabled={toolsLoading}
        >
          <i className="pi pi-plus"></i>
        </button>
      </div>

      <NativeToolsList
        nativeTools={nativeTools}
        availableTools={availableTools}
        onDelete={handleDeleteTool}
      />

      {showAddForm && (
        <NativeToolForm
          onAdd={handleAddTool}
          onCancel={handleCancelAdd}
          availableTools={availableTools}
          existingToolIds={existingToolIds}
        />
      )}
    </div>
  );
};
