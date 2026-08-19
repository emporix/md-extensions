import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ManagedMcpServerType } from '../../types/Mcp'
import { getMcpServerTypeLabel } from '../../utils/mcpHelpers'
import {
  FeatureGatedTypeOption,
  FeatureGatedTypeSection,
} from '../shared/FeatureGatedTypeSection'
import { McpRequiredMark } from './McpRequiredMark'

const MCP_TYPE_OPTIONS = [
  { labelKey: 'custom_mcp_server', value: 'custom' },
  { labelKey: 'dynamic_mcp_server', value: 'dynamic' },
] as const satisfies readonly FeatureGatedTypeOption<ManagedMcpServerType>[]

interface McpTypeSectionProps {
  mcpServerType: ManagedMcpServerType | ''
  isEditing: boolean
  hostingEnabled: boolean
  optionsReady?: boolean
  onMcpServerTypeChange: (value: ManagedMcpServerType) => void
}

export const McpTypeSection = ({
  mcpServerType,
  isEditing,
  hostingEnabled,
  optionsReady = true,
  onMcpServerTypeChange,
}: McpTypeSectionProps) => {
  const { t } = useTranslation()

  const typeOptions = useMemo(
    () =>
      MCP_TYPE_OPTIONS.filter(
        (option) =>
          hostingEnabled ||
          option.value !== 'dynamic' ||
          mcpServerType === 'dynamic'
      ),
    [hostingEnabled, mcpServerType]
  )

  return (
    <FeatureGatedTypeSection
      labelKey="mcp_server_type"
      placeholderKey="select_mcp_server_type"
      selectedType={mcpServerType}
      isEditing={isEditing}
      optionsReady={optionsReady}
      options={typeOptions}
      getSelectedLabel={(type) => getMcpServerTypeLabel(t, type)}
      requiredMark={<McpRequiredMark />}
      onTypeChange={onMcpServerTypeChange}
    />
  )
}
