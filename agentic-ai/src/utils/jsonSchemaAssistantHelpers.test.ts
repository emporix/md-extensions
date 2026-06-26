import { describe, expect, it } from 'vitest'
import { extractJsonSchemaFromAgentMessage } from './jsonSchemaAssistantHelpers'

describe('extractJsonSchemaFromAgentMessage', () => {
  it('extracts JSON Schema from a plain JSON object response', () => {
    const reply =
      '{"type":"object","properties":{"answer":{"type":"string"}},"required":["answer"]}'
    const result = extractJsonSchemaFromAgentMessage(reply)

    expect(result).toBe(
      JSON.stringify(
        {
          type: 'object',
          properties: { answer: { type: 'string' } },
          required: ['answer'],
        },
        null,
        2
      )
    )
  })

  it('extracts JSON Schema from markdown code fences', () => {
    const reply = `Here is the schema:
\`\`\`json
{"type":"object","properties":{"score":{"type":"number"}}}
\`\`\``
    const result = extractJsonSchemaFromAgentMessage(reply)

    expect(result).toBe(
      JSON.stringify(
        {
          type: 'object',
          properties: { score: { type: 'number' } },
        },
        null,
        2
      )
    )
  })

  it('unwraps double-encoded JSON strings', () => {
    const inner =
      '{"type":"object","properties":{"answer":{"type":"string"}}}'
    const result = extractJsonSchemaFromAgentMessage(JSON.stringify(inner))

    expect(result).toBe(JSON.stringify(JSON.parse(inner), null, 2))
  })

  it('returns null when no JSON object is present', () => {
    expect(extractJsonSchemaFromAgentMessage('')).toBeNull()
    expect(extractJsonSchemaFromAgentMessage('not json')).toBeNull()
    expect(extractJsonSchemaFromAgentMessage('[]')).toBeNull()
  })
})
