import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { MCP_SERVERS, McpKey } from '../../../utils/constants';
import { CustomHeaders } from '../CustomHeaders';

interface McpServer {
  type: 'predefined' | 'custom';
  domain?: McpKey;
  name?: string; // Only for custom servers
  tools?: string[];
  url?: string;
  transport?: string;
  config?: {
    headers?: Record<string, any>;
  };
}

interface McpServerFormProps {
  onAdd: (server: McpServer) => void;
  onCancel: () => void;
  editingServer?: McpServer;
}

export const McpServerForm: React.FC<McpServerFormProps> = React.memo(({ 
  onAdd, 
  onCancel,
  editingServer
}) => {
  const { t } = useTranslation();
  const isEditing = !!editingServer;
  
  const [newMcpType, setNewMcpType] = useState<'predefined' | 'custom'>(
    editingServer?.type || 'predefined'
  );
  const [newEmporixMcp, setNewEmporixMcp] = useState<McpKey>(
    editingServer?.type === 'predefined' && editingServer.domain ? editingServer.domain : 'order'
  );
  const [newEmporixTools, setNewEmporixTools] = useState<string[]>(
    editingServer?.tools || []
  );
  const [newCustomName, setNewCustomName] = useState(
    editingServer?.type === 'custom' && editingServer.name ? editingServer.name : ''
  );
  const [newCustomUrl, setNewCustomUrl] = useState(
    editingServer?.url || ''
  );
  const [newCustomTransport, setNewCustomTransport] = useState(
    editingServer?.transport || 'sse'
  );
  const [newCustomHeaders, setNewCustomHeaders] = useState<Record<string, any>>(
    editingServer?.config?.headers || {}
  );

  const handleAdd = () => {
    if (newMcpType === 'predefined' && newEmporixTools.length > 0) {
      onAdd({ 
        type: newMcpType, 
        domain: newEmporixMcp,
        tools: newEmporixTools 
      });
    } else if (newMcpType === 'custom' && newCustomName && newCustomUrl) {
      onAdd({ 
        type: 'custom', 
        name: newCustomName,
        url: newCustomUrl, 
        transport: newCustomTransport, 
        config: {
          headers: newCustomHeaders
        }
      });
    }
  };

  const isFormValid = () => {
    if (newMcpType === 'predefined') {
      return newEmporixTools.length > 0;
    }
    return newCustomName && newCustomUrl;
  };

  return (
    <div className="mcp-server-form">
      <div className="form-field">
        <label className="field-label">{t('type', 'Type')}</label>
        <Dropdown 
          value={newMcpType} 
          options={[
            { label: t('emporix', 'Emporix'), value: 'predefined' },
            { label: t('custom', 'Custom'), value: 'custom' }
          ]} 
          onChange={e => {
            setNewMcpType(e.value);
            if (e.value === 'predefined' && !newEmporixMcp) {
              setNewEmporixMcp('order');
            }
          }} 
          className="w-full" 
        />
      </div>
      
      {newMcpType === 'predefined' && (
        <>
          <div className="form-field">
            <label className="field-label">{t('mcp', 'MCP')}</label>
            <Dropdown 
              value={newEmporixMcp} 
              options={Object.entries(MCP_SERVERS).map(([key, val]) => ({ 
                label: val.name, 
                value: key 
              }))} 
              onChange={e => { 
                setNewEmporixMcp(e.value); 
                setNewEmporixTools([]); 
              }} 
              className="w-full" 
            />
          </div>
          <div className="form-field">
            <label className="field-label">{t('mcp_tools', 'Tools')}</label>
            <MultiSelect 
              value={newEmporixTools} 
              options={MCP_SERVERS[newEmporixMcp]?.tools?.map((tool: string) => ({ 
                label: tool, 
                value: tool 
              })) || []} 
              onChange={e => setNewEmporixTools(e.value)} 
              className="w-full" 
              display="chip" 
            />
          </div>
        </>
      )}
      
      {newMcpType === 'custom' && (
        <>
          <div className="form-field">
            <label className="field-label">{t('name', 'Name')}</label>
            <InputText 
              value={newCustomName} 
              onChange={e => setNewCustomName(e.target.value)} 
              className="w-full" 
            />
          </div>
          <div className="form-field">
            <label className="field-label">{t('url', 'Url')}</label>
            <InputText 
              value={newCustomUrl} 
              onChange={e => setNewCustomUrl(e.target.value)} 
              className="w-full" 
            />
          </div>
          <div className="form-field">
            <label className="field-label">{t('transport_layer', 'Transport layer')}</label>
            <Dropdown 
              value={newCustomTransport} 
              options={[
                { label: 'SSE', value: 'sse', disabled: false },
                { label: 'WebSocket', value: 'ws', disabled: true },
                { label: 'HTTP', value: 'http', disabled: true }
              ]} 
              onChange={e => setNewCustomTransport(e.value)} 
              className="w-full" 
              optionDisabled="disabled" 
            />
          </div>
          <div className="form-field">
            <label className="field-label">{t('headers', 'Headers')}</label>
            <CustomHeaders
              value={newCustomHeaders}
              onChange={setNewCustomHeaders}
            />
          </div>
        </>
      )}
      
      <div className="form-field" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button 
          label={t('cancel', 'Cancel')} 
          className="discard-button" 
          onClick={onCancel} 
        />
        <Button 
          label={isEditing ? t('update', 'Update') : t('add', 'Add')} 
          className="save-agent-button" 
          onClick={handleAdd}
          disabled={!isFormValid()} 
        />
      </div>
    </div>
  );
}); 