import {
  McpTool,
  McpToolInvocationArgsLocation,
  McpToolInvocationMethod,
} from '../types/Mcp'
import { MCP_TOOL_NAME_PATTERN } from './mcpHelpers'
import { validateAgentOutputJsonSchema } from './validateJsonSchema'

export const MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS = {
  emptyResponse: 'mcp_tool_from_function_assistant_empty_response',
  templateNotFound: 'mcp_tool_from_function_assistant_template_not_found',
  extractFailed: 'mcp_tool_from_function_assistant_extract_failed',
  applyFailed: 'mcp_tool_from_function_assistant_apply_failed',
} as const

export const MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_MESSAGES = Object.values(
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS
) as readonly string[]

const CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i

const INVOCATION_METHODS = new Set<string>(
  Object.values(McpToolInvocationMethod)
)

const ARGS_LOCATIONS = new Set<string>(
  Object.values(McpToolInvocationArgsLocation)
)

export type McpToolFromFunctionDraft = {
  toolName?: string
  description?: string
  prompt?: string
  method?: string
  argsLocation?: string
  inputSchema?: unknown
  requiredScopes?: unknown
}

const tryParseTopLevelJsonObject = (
  text: string
): Record<string, unknown> | null => {
  try {
    let parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed.trim())
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const readDraftScopeIds = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const filterRequiredScopesToCatalog = (
  generated: string[],
  catalogIds: ReadonlySet<string>
): string[] => {
  const seen = new Set<string>()
  const filtered: string[] = []

  for (const scopeId of generated) {
    if (seen.has(scopeId)) {
      continue
    }
    if (catalogIds.size > 0 && !catalogIds.has(scopeId)) {
      continue
    }
    seen.add(scopeId)
    filtered.push(scopeId)
  }

  return filtered
}

const normalizeInputSchema = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    const validation = validateAgentOutputJsonSchema(trimmed)
    return validation.valid ? trimmed : null
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const serialized = JSON.stringify(value, null, 2)
    const validation = validateAgentOutputJsonSchema(serialized)
    return validation.valid ? serialized : null
  }
  return null
}

export const extractMcpToolDraftFromAgentMessage = (
  message: string
): McpToolFromFunctionDraft | null => {
  const trimmed = message.trim()
  if (!trimmed) {
    return null
  }

  const candidates = [trimmed]
  const codeMatch = CODE_BLOCK_REGEX.exec(trimmed)
  if (codeMatch?.[1]) {
    candidates.unshift(codeMatch[1].trim())
  }

  for (const candidate of candidates) {
    const obj = tryParseTopLevelJsonObject(candidate)
    if (!obj) {
      continue
    }

    return {
      toolName: readString(obj.toolName) ?? undefined,
      description: readString(obj.description) ?? undefined,
      prompt: readString(obj.prompt) ?? undefined,
      method: readString(obj.method) ?? undefined,
      argsLocation: readString(obj.argsLocation) ?? undefined,
      inputSchema: obj.inputSchema,
      requiredScopes: obj.requiredScopes,
    }
  }

  return null
}

export type ApplyMcpToolDraftResult = {
  tool: McpTool
  appliedFieldCount: number
}

export type ApplyMcpToolDraftOptions = {
  /** When omitted, requiredScopes from the draft are not applied (e.g. catalog still loading). */
  availableScopeIds?: readonly string[] | undefined
}

export const applyMcpToolDraftToTool = (
  tool: McpTool,
  draft: McpToolFromFunctionDraft,
  options?: ApplyMcpToolDraftOptions
): ApplyMcpToolDraftResult => {
  let appliedFieldCount = 0
  const nextTool: McpTool = { ...tool }
  const nextConfig = {
    requiredScopes: tool.config?.requiredScopes ?? [],
    inputSchema: tool.config?.inputSchema ?? '',
    invocation: {
      functionId: tool.config?.invocation?.functionId ?? '',
      method: tool.config?.invocation?.method ?? McpToolInvocationMethod.POST,
      argsLocation: tool.config?.invocation?.argsLocation,
    },
  }

  const toolName = draft.toolName?.trim()
  if (toolName && MCP_TOOL_NAME_PATTERN.test(toolName)) {
    nextTool.name = toolName
    appliedFieldCount += 1
  }

  const description = draft.description?.trim()
  if (description) {
    nextTool.description = description
    appliedFieldCount += 1
  }

  const prompt = draft.prompt?.trim()
  if (prompt) {
    nextTool.prompt = prompt
    appliedFieldCount += 1
  }

  const method = draft.method?.trim().toUpperCase()
  if (method && INVOCATION_METHODS.has(method)) {
    nextConfig.invocation.method = method
    appliedFieldCount += 1
  }

  const argsLocation = draft.argsLocation?.trim().toLowerCase()
  if (argsLocation && ARGS_LOCATIONS.has(argsLocation)) {
    nextConfig.invocation.argsLocation = argsLocation
    appliedFieldCount += 1
  }

  const inputSchema = normalizeInputSchema(draft.inputSchema)
  if (inputSchema) {
    nextConfig.inputSchema = inputSchema
    appliedFieldCount += 1
  }

  const draftScopeIds = readDraftScopeIds(draft.requiredScopes)
  if (draftScopeIds && options?.availableScopeIds !== undefined) {
    const catalogIds = new Set(
      options.availableScopeIds.filter((scopeId) => scopeId.trim())
    )
    nextConfig.requiredScopes = filterRequiredScopesToCatalog(
      draftScopeIds,
      catalogIds
    )
    appliedFieldCount += 1
  }

  nextTool.config = nextConfig

  return {
    tool: nextTool,
    appliedFieldCount,
  }
}
