export const JSON_SCHEMA_ASSISTANT_I18N_KEYS = {
  emptyResponse: 'json_schema_assistant_empty_response',
  templateNotFound: 'json_schema_assistant_template_not_found',
} as const

export const JSON_SCHEMA_ASSISTANT_I18N_MESSAGES = Object.values(
  JSON_SCHEMA_ASSISTANT_I18N_KEYS
) as readonly string[]

const CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i

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

export const extractJsonSchemaFromAgentMessage = (
  message: string
): string | null => {
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
    if (obj) {
      return JSON.stringify(obj, null, 2)
    }
  }

  return null
}
