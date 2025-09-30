import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { McpServer } from '../../../types/Agent';
import { McpServer as ManagedMcpServer } from '../../../types/Mcp';
import { MCP_SERVERS, McpKey } from '../../../utils/constants';

interface McpServerFormProps {
  onAdd: (mcpServer: McpServer) => void;
  onCancel: () => void;
  availableMcpServers: ManagedMcpServer[];
  existingServerIds: string[];
}

export const McpServerForm: React.FC<McpServerFormProps> = ({ 
  onAdd, 
  onCancel, 
  availableMcpServers,
  existingServerIds
}) => {
  const { t } = useTranslation();
  const [serverType, setServerType] = useState<'predefined' | 'custom'>('predefined');
  const [selectedDomain, setSelectedDomain] = useState<McpKey>('order');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedCustomServerId, setSelectedCustomServerId] = useState<string>('');

  // Filter out custom servers that are already selected
  const availableCustomServers = availableMcpServers
    .filter(server => !existingServerIds.includes(server.id))
    .map(server => ({
      label: server.name,
      value: server.id
    }));

  const predefinedOptions = Object.entries(MCP_SERVERS)
    .map(([key, val]) => ({ 
      label: val.name, 
      value: key as McpKey
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const toolOptions = (MCP_SERVERS[selectedDomain]?.tools?.map((tool: string) => ({ 
    label: tool, 
    value: tool 
  })) || [])
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleAdd = () => {
    if (serverType === 'predefined' && selectedTools.length > 0) {
      onAdd({ 
        type: 'predefined', 
        domain: selectedDomain,
        tools: selectedTools 
      });
    } else if (serverType === 'custom' && selectedCustomServerId) {
      onAdd({ 
        type: 'custom', 
        mcpServer: {
          id: selectedCustomServerId
        }
      });
    }
  };

  const isFormValid = () => {
    if (serverType === 'predefined') {
      return selectedTools.length > 0;
    }
    return selectedCustomServerId !== '';
  };

  return (
    <div className="mcp-server-form">
      <div className="mcp-server-form-content">
        <div className="form-field">
          <label className="field-label">{t('type', 'Type')}</label>
          <Dropdown
            value={serverType}
            options={[
              { label: t('emporix', 'Emporix'), value: 'predefined' },
              { label: t('custom', 'Custom'), value: 'custom' }
            ]}
            onChange={(e) => {
              setServerType(e.value);
              // Reset selections when changing type
              setSelectedTools([]);
              setSelectedCustomServerId('');
            }}
            className="w-full"
            appendTo="self"
          />
        </div>

        {serverType === 'predefined' && (
          <>
            <div className="form-field">
              <label className="field-label">{t('mcp', 'MCP')}</label>
              <Dropdown
                value={selectedDomain}
                options={predefinedOptions}
                onChange={(e) => {
                  setSelectedDomain(e.value);
                  setSelectedTools([]); // Reset tools when domain changes
                }}
                className="w-full"
                appendTo="self"
              />
            </div>
            <div className="form-field">
              <label className="field-label">{t('mcp_tools', 'Tools')}</label>
              <MultiSelect
                value={selectedTools}
                options={toolOptions}
                onChange={(e) => setSelectedTools(e.value)}
                placeholder={t('select_tools_placeholder', 'Select tools')}
                className="w-full"
                display="chip"
                appendTo="self"
              />
            </div>
          </>
        )}

        {serverType === 'custom' && (
          <div className="form-field">
            <label className="field-label">{t('select_mcp_server', 'Select MCP Server')}</label>
            <Dropdown
              value={selectedCustomServerId}
              options={availableCustomServers}
              onChange={(e) => setSelectedCustomServerId(e.value)}
              placeholder={t('select_mcp_server_placeholder', 'Choose an MCP server')}
              className="w-full"
              appendTo="self"
            />
          </div>
        )}
        
        <div className="mcp-server-form-actions">
          <Button
            label={t('add', 'Add')}
            onClick={handleAdd}
            disabled={!isFormValid()}
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
