import { describe, expect, it } from 'vitest'
import {
  isValidAgentOutputJsonSchema,
  validateAgentOutputJsonSchema,
} from './validateJsonSchema'

describe('validateAgentOutputJsonSchema', () => {
  it('accepts empty input', () => {
    expect(validateAgentOutputJsonSchema('')).toEqual({ valid: true })
    expect(validateAgentOutputJsonSchema('   ')).toEqual({ valid: true })
  })

  it('rejects invalid JSON syntax', () => {
    expect(validateAgentOutputJsonSchema('{ type: "object" }')).toEqual({
      valid: false,
      errorKey: 'output_format_invalid_json',
    })
  })

  it('rejects non-object root values', () => {
    expect(validateAgentOutputJsonSchema('"text"')).toEqual({
      valid: false,
      errorKey: 'output_format_invalid_json_schema',
    })
    expect(validateAgentOutputJsonSchema('[]')).toEqual({
      valid: false,
      errorKey: 'output_format_invalid_json_schema',
    })
  })

  it('rejects objects without JSON Schema keywords', () => {
    expect(validateAgentOutputJsonSchema('{"foo":"bar"}')).toEqual({
      valid: false,
      errorKey: 'output_format_invalid_json_schema',
    })
  })

  it('accepts a valid JSON Schema document', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        answer: { type: 'string' },
      },
      required: ['answer'],
    })

    expect(validateAgentOutputJsonSchema(schema)).toEqual({ valid: true })
    expect(isValidAgentOutputJsonSchema(schema)).toBe(true)
  })

  it('rejects invalid JSON Schema keyword values', () => {
    const result = validateAgentOutputJsonSchema(
      JSON.stringify({ type: 'invalid-type' })
    )

    expect(result.valid).toBe(false)
    expect(result.errorKey).toBe('output_format_invalid_json_schema')
    expect(result.detail).toBeTruthy()
  })
})
