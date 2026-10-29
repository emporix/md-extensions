import { describe, expect, it } from 'vitest'
import {
  formatChatResponseText,
  formatReadableCommunicationContent,
  normalizeEscapedNewlines,
} from './formatHelpers'

describe('normalizeEscapedNewlines', () => {
  it('converts escaped newlines to real newlines', () => {
    expect(normalizeEscapedNewlines('line1\\nline2')).toBe('line1\nline2')
  })
})

describe('formatReadableCommunicationContent', () => {
  it('pretty-prints JSON objects', () => {
    const input = '{"orderId":"EON1002","status":"open"}'
    expect(formatReadableCommunicationContent(input)).toBe(
      JSON.stringify({ orderId: 'EON1002', status: 'open' }, null, 2)
    )
  })

  it('pretty-prints JSON arrays', () => {
    const input = '[{"id":1},{"id":2}]'
    expect(formatReadableCommunicationContent(input)).toBe(
      JSON.stringify([{ id: 1 }, { id: 2 }], null, 2)
    )
  })

  it('pretty-prints double-encoded JSON strings', () => {
    const inner = JSON.stringify({ hasErrors: true, explanation: 'Failed' })
    const input = JSON.stringify(inner)
    expect(formatReadableCommunicationContent(input)).toBe(
      JSON.stringify(JSON.parse(inner), null, 2)
    )
  })

  it('pretty-prints markdown-fenced JSON', () => {
    const input = '```json\n{"foo":"bar"}\n```'
    expect(formatReadableCommunicationContent(input)).toBe(
      JSON.stringify({ foo: 'bar' }, null, 2)
    )
  })

  it('normalizes escaped newlines in plain text', () => {
    expect(formatReadableCommunicationContent('Hello\\nWorld')).toBe(
      'Hello\nWorld'
    )
  })

  it('leaves invalid JSON as text with newline normalization', () => {
    const input = 'Not json\\nstill readable'
    expect(formatReadableCommunicationContent(input)).toBe(
      'Not json\nstill readable'
    )
  })

  it('returns empty content unchanged', () => {
    expect(formatReadableCommunicationContent('')).toBe('')
    expect(formatReadableCommunicationContent('   ')).toBe('   ')
  })
})

describe('formatChatResponseText', () => {
  it('fences a JSON object', () => {
    expect(
      formatChatResponseText('{"orderId":"EON1002","status":"open"}')
    ).toBe(
      `\`\`\`json\n${JSON.stringify({ orderId: 'EON1002', status: 'open' }, null, 2)}\n\`\`\``
    )
  })

  it('fences a JSON array', () => {
    expect(formatChatResponseText('[{"id":1}]')).toBe(
      `\`\`\`json\n${JSON.stringify([{ id: 1 }], null, 2)}\n\`\`\``
    )
  })

  it('pretty-prints a json code fence', () => {
    expect(formatChatResponseText('```json\n{"foo":"bar"}\n```')).toBe(
      `\`\`\`json\n${JSON.stringify({ foo: 'bar' }, null, 2)}\n\`\`\``
    )
  })

  it('pretty-prints JSON embedded in prose and leaves the prose', () => {
    const formatted = formatChatResponseText('Result: {"ok":true}')
    expect(formatted.startsWith('Result:')).toBe(true)
    expect(formatted).toContain(
      `\`\`\`json\n${JSON.stringify({ ok: true }, null, 2)}\n\`\`\``
    )
  })

  it('leaves an incomplete JSON stream unchanged', () => {
    const partial = '{"orderId":"EON1002","items":[{"id":1}'
    expect(formatChatResponseText(partial)).toBe(partial)
  })

  it('leaves plain text unchanged', () => {
    expect(formatChatResponseText('Hello there')).toBe('Hello there')
  })
})
