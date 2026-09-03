import type { FunctionZipSourceFile } from './functionZipSource.helpers'
import {
  formatZipSourceBlocksForPrompt,
  SOURCE_DELIMITER_INSTRUCTION,
} from './functionZipSourcePrompt.helpers'
import { MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS } from './loadLatestFunctionZipSource.helpers'

export type McpToolFromFunctionPromptContext = {
  functionId: string
  functionName?: string
  runtime?: string
}

export const buildMcpToolFromFunctionPrompt = (
  context: McpToolFromFunctionPromptContext,
  sourceFiles: FunctionZipSourceFile[]
): string => {
  const { sourceBlocks, truncationNote } = formatZipSourceBlocksForPrompt(
    sourceFiles,
    'Infer the MCP tool definition from the files below.',
    MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS.noSource
  )

  const functionLines = [
    `Cloud function ID: ${context.functionId.trim()}`,
    context.functionName?.trim()
      ? `Cloud function name: ${context.functionName.trim()}`
      : null,
    context.runtime?.trim() ? `Runtime: ${context.runtime.trim()}` : null,
  ].filter(Boolean)

  return [
    'Analyze the cloud function source and generate a complete MCP tool definition as JSON.',
    'Return only a JSON object with these keys:',
    '- toolName (string, no spaces, letters/numbers/underscores only)',
    '- description (string)',
    '- prompt (string, when the agent should call this tool)',
    '- method (GET, POST, PUT, PATCH, or DELETE)',
    '- argsLocation ("body" or "query")',
    '- inputSchema (valid JSON Schema object for tool input)',
    '- requiredScopes (array of IAM scope strings)',
    '',
    'Cloud function context:',
    ...functionLines,
    '',
    SOURCE_DELIMITER_INSTRUCTION,
    '',
    'Cloud function source files from the latest media deployment:',
    sourceBlocks,
    truncationNote,
  ]
    .filter((line) => line !== null)
    .join('\n')
    .trim()
}
