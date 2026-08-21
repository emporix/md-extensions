import type { TFunction } from 'i18next'
import type { McpServer, McpTool } from '../types/Mcp'
import { isDynamicMcpServer, MCP_TOOL_NAME_PATTERN } from './mcpHelpers'
import { isValidAgentOutputJsonSchema } from './validateJsonSchema'
import { isValidIdFormat, ValidationError } from './validation'

const assertRequired = (
  value: string | undefined | null,
  message: string,
  field?: string
): void => {
  if (!value || value.trim() === '') {
    throw new ValidationError(message, field)
  }
}

const getToolLabel = (index: number, t: TFunction): string =>
  t('mcp_tool_unnamed', { index: index + 1 })

const hasEnabledDynamicTool = (tools: McpTool[]): boolean =>
  tools.some((tool) => tool.enabled !== false)

export const validateCustomMcpServer = (
  mcpServer: {
    id?: string
    name?: string
    config?: { url?: string }
  },
  t: TFunction
) => {
  assertRequired(mcpServer.id, t('mcp_validation_mcp_id_required'), 'id')

  if (mcpServer.id && !isValidIdFormat(mcpServer.id.trim())) {
    throw new ValidationError(t('mcp_validation_mcp_id_format'), 'id')
  }

  assertRequired(mcpServer.name, t('mcp_validation_mcp_name_required'), 'name')
  assertRequired(mcpServer.config?.url, t('mcp_validation_mcp_url_required'), 'url')

  if (mcpServer.config?.url?.trim()) {
    try {
      new URL(mcpServer.config.url.trim())
    } catch {
      throw new ValidationError(t('mcp_validation_mcp_url_invalid'), 'url')
    }
  }
}

export const validateMcpTool = (tool: McpTool, index: number, t: TFunction) => {
  if (tool.enabled === false) {
    return
  }

  const toolLabel = getToolLabel(index, t)

  assertRequired(
    tool.name,
    t('mcp_validation_tool_field_required', {
      tool: toolLabel,
      field: t('mcp_tool_name'),
    }),
    `tools[${index}].name`
  )

  if (tool.name && !MCP_TOOL_NAME_PATTERN.test(tool.name.trim())) {
    throw new ValidationError(
      t('mcp_tool_name_no_whitespace'),
      `tools[${index}].name`
    )
  }

  assertRequired(
    tool.prompt,
    t('mcp_validation_tool_field_required', {
      tool: toolLabel,
      field: t('mcp_tool_prompt'),
    }),
    `tools[${index}].prompt`
  )

  assertRequired(
    tool.config?.inputSchema,
    t('mcp_validation_tool_field_required', {
      tool: toolLabel,
      field: t('mcp_tool_input_schema'),
    }),
    `tools[${index}].config.inputSchema`
  )

  if (
    tool.config?.inputSchema &&
    !isValidAgentOutputJsonSchema(tool.config.inputSchema)
  ) {
    throw new ValidationError(
      t('mcp_tool_input_schema_invalid_schema'),
      `tools[${index}].config.inputSchema`
    )
  }

  assertRequired(
    tool.config?.invocation?.functionId,
    t('mcp_validation_tool_field_required', {
      tool: toolLabel,
      field: t('mcp_tool_function_id'),
    }),
    `tools[${index}].config.invocation.functionId`
  )

  assertRequired(
    tool.config?.invocation?.method,
    t('mcp_validation_tool_field_required', {
      tool: toolLabel,
      field: t('mcp_tool_http_method'),
    }),
    `tools[${index}].config.invocation.method`
  )
}

export const validateDynamicMcpServer = (mcpServer: McpServer, t: TFunction) => {
  assertRequired(mcpServer.id, t('mcp_validation_mcp_id_required'), 'id')

  if (mcpServer.id && !isValidIdFormat(mcpServer.id.trim())) {
    throw new ValidationError(t('mcp_validation_mcp_id_format'), 'id')
  }

  assertRequired(mcpServer.name, t('mcp_validation_mcp_name_required'), 'name')

  const tools = mcpServer.tools ?? []
  if (tools.length === 0) {
    throw new ValidationError(t('mcp_tool_remove_last_disabled'), 'tools')
  }

  if (mcpServer.enabled !== false && !hasEnabledDynamicTool(tools)) {
    throw new ValidationError(t('mcp_validation_enabled_tool_required'), 'tools')
  }

  const names = new Set<string>()
  tools.forEach((tool, index) => {
    validateMcpTool(tool, index, t)
    const key = tool.name.trim().toLowerCase()
    if (!key) {
      return
    }
    if (names.has(key)) {
      throw new ValidationError(
        t('mcp_validation_tool_name_duplicate', { name: tool.name.trim() }),
        `tools[${index}].name`
      )
    }
    names.add(key)
  })
}

export const validateMcpServer = (mcpServer: McpServer, t: TFunction) => {
  if (isDynamicMcpServer(mcpServer)) {
    validateDynamicMcpServer(mcpServer, t)
    return
  }

  validateCustomMcpServer(mcpServer, t)
}
