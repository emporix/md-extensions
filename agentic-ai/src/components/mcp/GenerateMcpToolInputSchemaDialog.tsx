import React from 'react'
import {
  McpToolInputSchemaAssistantContext,
  useMcpToolInputSchemaAssistant,
} from '../../hooks/useMcpToolInputSchemaAssistant'
import { HelperAgentGenerateDialog } from '../shared/HelperAgentGenerateDialog'

interface GenerateMcpToolInputSchemaDialogProps {
  visible: boolean
  context: McpToolInputSchemaAssistantContext
  onHide: () => void
  onApply: (formattedSchema: string) => void
}

export const GenerateMcpToolInputSchemaDialog: React.FC<
  GenerateMcpToolInputSchemaDialogProps
> = ({ visible, context, onHide, onApply }) => {
  const assistantState = useMcpToolInputSchemaAssistant({
    visible,
    context,
    onApplyGeneratedSchema: onApply,
    onClose: onHide,
  })

  return (
    <HelperAgentGenerateDialog
      visible={visible}
      titleKey="generate_json_schema"
      introKey="mcp_tool_input_schema_assistant_intro"
      readyKey="mcp_tool_input_schema_assistant_ready"
      workingLabelKey="mcp_tool_input_schema_generate_working"
      state={assistantState}
      onHide={onHide}
    />
  )
}
