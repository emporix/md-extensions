import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getToolTypeLabel } from '../../utils/toolHelpers'
import {
  FeatureGatedTypeOption,
  FeatureGatedTypeSection,
} from '../shared/FeatureGatedTypeSection'
import { ToolRequiredMark } from './ToolRequiredMark'

const TOOL_TYPE_OPTIONS = [
  { labelKey: 'slack', value: 'slack' },
  { labelKey: 'microsoft_teams', value: 'teams' },
  { labelKey: 'rag_custom', value: 'rag_custom' },
  { labelKey: 'rag_emporix', value: 'rag_emporix' },
] as const satisfies readonly FeatureGatedTypeOption<string>[]

interface ToolTypeSectionProps {
  toolType: string
  isEditing: boolean
  msTeamsEnabled: boolean
  optionsReady?: boolean
  onToolTypeChange: (value: string) => void
}

export const ToolTypeSection = ({
  toolType,
  isEditing,
  msTeamsEnabled,
  optionsReady = true,
  onToolTypeChange,
}: ToolTypeSectionProps) => {
  const { t } = useTranslation()

  const toolTypeOptions = useMemo(
    () =>
      TOOL_TYPE_OPTIONS.filter(
        (option) =>
          msTeamsEnabled || option.value !== 'teams' || toolType === 'teams'
      ),
    [msTeamsEnabled, toolType]
  )

  return (
    <FeatureGatedTypeSection
      labelKey="tool_type"
      placeholderKey="select_tool_type"
      selectedType={toolType}
      isEditing={isEditing}
      optionsReady={optionsReady}
      options={toolTypeOptions}
      getSelectedLabel={(type) => getToolTypeLabel(t, type)}
      requiredMark={<ToolRequiredMark />}
      onTypeChange={onToolTypeChange}
    />
  )
}
