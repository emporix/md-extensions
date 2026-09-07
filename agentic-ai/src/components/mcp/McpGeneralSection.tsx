import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import {
  CustomMcpServerTransportType,
  ManagedMcpServerType,
} from '../../types/Mcp'
import { getMcpTransportOptions } from '../../utils/mcpHelpers'
import { McpRequiredMark } from './McpRequiredMark'
import { McpTypeSection } from './McpTypeSection'

interface McpGeneralSectionProps {
  mcpServerId: string
  mcpServerName: string
  mcpServerType: ManagedMcpServerType | ''
  transport?: CustomMcpServerTransportType
  isEditing: boolean
  hostingEnabled: boolean
  optionsReady?: boolean
  transportDisabled?: boolean
  onIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onMcpServerTypeChange: (value: ManagedMcpServerType) => void
  onTransportChange?: (value: CustomMcpServerTransportType) => void
}

export const McpGeneralSection = ({
  mcpServerId,
  mcpServerName,
  mcpServerType,
  transport,
  isEditing,
  hostingEnabled,
  optionsReady = true,
  transportDisabled = false,
  onIdChange,
  onNameChange,
  onMcpServerTypeChange,
  onTransportChange,
}: McpGeneralSectionProps) => {
  const { t } = useTranslation()
  const transportOptions = useMemo(() => getMcpTransportOptions(t), [t])

  return (
    <div className="mcp-detail-form-row mcp-general-row">
      <div className="form-field">
        <label className="field-label">
          {t('mcp_server_id')}
          {!isEditing && <McpRequiredMark />}
        </label>
        <InputText
          value={mcpServerId}
          onChange={(event) => onIdChange(event.target.value)}
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
          onChange={(event) => onNameChange(event.target.value)}
          className={`w-full${!mcpServerName.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_mcp_server_name')}
        />
      </div>

      <McpTypeSection
        mcpServerType={mcpServerType}
        isEditing={isEditing}
        hostingEnabled={hostingEnabled}
        optionsReady={optionsReady}
        onMcpServerTypeChange={onMcpServerTypeChange}
      />

      {transport ? (
        <div className="form-field">
          <label className="field-label">{t('transport')}</label>
          <Dropdown
            value={transport}
            options={transportOptions}
            onChange={(event) => onTransportChange?.(event.value)}
            className="w-full"
            placeholder={t('select_transport')}
            appendTo="self"
            disabled={transportDisabled}
          />
        </div>
      ) : null}
    </div>
  )
}
