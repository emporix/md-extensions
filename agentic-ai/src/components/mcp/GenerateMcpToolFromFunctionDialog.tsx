import React from 'react'
import { McpTool } from '../../types/Mcp'
import {
  McpToolFromFunctionAssistantContext,
  useMcpToolFromFunctionAssistant,
} from '../../hooks/useMcpToolFromFunctionAssistant'
import { HelperAgentGenerateDialog } from '../shared/HelperAgentGenerateDialog'

interface GenerateMcpToolFromFunctionDialogProps {
  visible: boolean
  tool: McpTool
  context: McpToolFromFunctionAssistantContext
  availableScopeIds?: readonly string[] | undefined
  onHide: () => void
  onApply: (tool: McpTool) => void
}

export const GenerateMcpToolFromFunctionDialog: React.FC<
  GenerateMcpToolFromFunctionDialogProps
> = ({ visible, tool, context, availableScopeIds, onHide, onApply }) => {
  const assistantState = useMcpToolFromFunctionAssistant({
    visible,
    tool,
    context,
    availableScopeIds,
    onApplyGeneratedTool: onApply,
    onClose: onHide,
  })

  return (
    <HelperAgentGenerateDialog
      visible={visible}
      titleKey="mcp_tool_from_function_dialog_title"
      introKey="mcp_tool_from_function_assistant_intro"
      readyKey="mcp_tool_from_function_assistant_ready"
      workingLabelKey="mcp_tool_from_function_generate_working"
      state={assistantState}
      onHide={onHide}
    />
  )
}
