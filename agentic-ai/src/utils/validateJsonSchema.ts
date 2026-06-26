import Ajv, { type ErrorObject } from 'ajv'

export type JsonSchemaValidationErrorKey =
  | 'output_invalid_json'
  | 'output_invalid_json_schema'

export interface JsonSchemaValidationResult {
  valid: boolean
  errorKey?: JsonSchemaValidationErrorKey
  detail?: string
}

const ROOT_SCHEMA_KEYWORDS = [
  '$ref',
  '$defs',
  'definitions',
  'type',
  'properties',
  'items',
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  'enum',
  'const',
  'if',
  '$schema',
] as const

const ajv = new Ajv({ allErrors: true, strict: false })

const formatAjvError = (
  errors: ErrorObject[] | null | undefined
): string | undefined => {
  const first = errors?.[0]
  if (!first) {
    return undefined
  }

  const path = first.instancePath || first.schemaPath
  if (first.message) {
    return path ? `${path}: ${first.message}` : first.message
  }

  return path || undefined
}

const hasRecognizedSchemaKeyword = (
  schema: Record<string, unknown>
): boolean => {
  return ROOT_SCHEMA_KEYWORDS.some((keyword) => keyword in schema)
}

export const validateAgentOutputJsonSchema = (
  text: string
): JsonSchemaValidationResult => {
  const trimmed = text.trim()
  if (!trimmed) {
    return { valid: true }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { valid: false, errorKey: 'output_invalid_json' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errorKey: 'output_invalid_json_schema' }
  }

  const schema = parsed as Record<string, unknown>

  if (!hasRecognizedSchemaKeyword(schema)) {
    return { valid: false, errorKey: 'output_invalid_json_schema' }
  }

  if (!ajv.validateSchema(schema)) {
    return {
      valid: false,
      errorKey: 'output_invalid_json_schema',
      detail: formatAjvError(ajv.errors),
    }
  }

  return { valid: true }
}

export const isValidAgentOutputJsonSchema = (text: string): boolean => {
  return validateAgentOutputJsonSchema(text).valid
}

export const getAgentOutputValidationMessage = (
  result: JsonSchemaValidationResult,
  translate: (key: JsonSchemaValidationErrorKey) => string
): string => {
  if (result.valid || !result.errorKey) {
    return ''
  }

  const baseMessage = translate(result.errorKey)
  return result.detail ? `${baseMessage} (${result.detail})` : baseMessage
}
