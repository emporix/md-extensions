import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { NativeTool } from '../../../types/Agent';
import { Tool } from '../../../types/Tool';

interface NativeToolFormProps {
  onAdd: (nativeTool: NativeTool) => void;
  onCancel: () => void;
  availableTools: Tool[];
  existingToolIds: string[];
}

export const NativeToolForm: React.FC<NativeToolFormProps> = ({ 
  onAdd, 
  onCancel, 
  availableTools,
  existingToolIds
}) => {
  const { t } = useTranslation();
  const [selectedToolId, setSelectedToolId] = useState<string>('');

  // Filter out tools that are already selected
  const availableOptions = availableTools
    .filter(tool => !existingToolIds.includes(tool.id))
    .map(tool => ({
      label: tool.name,
      value: tool.id
    }));

  const handleAdd = () => {
    if (selectedToolId) {
      onAdd({ id: selectedToolId });
    }
  };

  return (
    <div className="native-tool-form">
      <div className="native-tool-form-content">
        <div className="form-field">
          <label className="field-label">{t('select_tool', 'Select Tool')}</label>
          <Dropdown
            value={selectedToolId}
            options={availableOptions}
            onChange={(e) => setSelectedToolId(e.value)}
            placeholder={t('select_tool_placeholder', 'Choose a tool to add')}
            className="w-full"
            appendTo="self"
          />
        </div>
        
        <div className="native-tool-form-actions">
          <Button
            label={t('add', 'Add')}
            onClick={handleAdd}
            disabled={!selectedToolId}
            className="p-button-sm"
          />
          <Button
            label={t('cancel', 'Cancel')}
            onClick={onCancel}
            className="p-button-outlined p-button-sm"
          />
        </div>
      </div>
    </div>
  );
};
