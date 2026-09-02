import type { FunctionZipSourceFile } from './functionZipSource.helpers'
import {
  formatZipSourceBlocksForPrompt,
  SOURCE_DELIMITER_INSTRUCTION,
} from './functionZipSourcePrompt.helpers'
import { MCP_TOOL_INPUT_SCHEMA_ZIP_I18N_KEYS } from './loadLatestFunctionZipSource.helpers'

export type McpToolInputSchemaPromptContext = {
  toolName: string
  toolDescription?: string
  functionId: string
  httpMethod: string
  argsLocation?: string
}

export const buildMcpToolInputSchemaPrompt = (
  context: McpToolInputSchemaPromptContext,
  sourceFiles: FunctionZipSourceFile[]
): string => {
  const { sourceBlocks, truncationNote } = formatZipSourceBlocksForPrompt(
    sourceFiles,
    'Infer the input schema from the files below and common patterns in the function code.',
    MCP_TOOL_INPUT_SCHEMA_ZIP_I18N_KEYS.noSource
  )

  const toolLines = [
    `Tool name: ${context.toolName.trim() || '(unnamed)'}`,
    context.toolDescription?.trim()
      ? `Tool description: ${context.toolDescription.trim()}`
      : null,
    `Cloud function ID: ${context.functionId.trim()}`,
    `HTTP method: ${context.httpMethod.trim()}`,
    context.argsLocation?.trim()
      ? `Arguments location: ${context.argsLocation.trim()}`
      : null,
  ].filter(Boolean)

  return [
    'Generate a JSON Schema that describes the input parameters for this MCP tool.',
    'The schema must be valid JSON Schema (draft-07 or later) and suitable as an MCP tool input schema.',
    'Return only the JSON Schema object (no markdown, no explanation).',
    '',
    'Tool context:',
    ...toolLines,
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
