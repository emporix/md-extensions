import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import type { McpConfigField } from '../../hooks/useMcpConfig'
import { McpRequiredMark } from './McpRequiredMark'

interface McpGeneralSectionProps {
  mcpServerId: string
  mcpServerName: string
  isEditing: boolean
  onFieldChange: (field: McpConfigField, value: string) => void
}

export const McpGeneralSection: React.FC<McpGeneralSectionProps> = ({
  mcpServerId,
  mcpServerName,
  isEditing,
  onFieldChange,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mcp-detail-form-row">
      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_id')}
          {!isEditing && <McpRequiredMark />}
        </label>
        <InputText
          value={mcpServerId}
          onChange={(event) => onFieldChange('mcpServerId', event.target.value)}
          className={`w-full${!isEditing && !mcpServerId.trim() ? ' p-invalid' : ''}`}
          disabled={isEditing}
          placeholder={t('enter_mcp_server_id')}
          autoFocus={!isEditing}
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_name')}
          <McpRequiredMark />
        </label>
        <InputText
          value={mcpServerName}
          onChange={(event) =>
            onFieldChange('mcpServerName', event.target.value)
          }
          className={`w-full${!mcpServerName.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_mcp_server_name')}
        />
      </div>
    </div>
  )
}
