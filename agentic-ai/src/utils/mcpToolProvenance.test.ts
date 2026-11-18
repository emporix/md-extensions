import { describe, expect, it } from 'vitest'
import { PROVENANCE_SCHEMA_URL } from './aiProvenance'
import {
  rebaseStoredToolProvenance,
  stampToolProvenance,
  toolProvenanceField,
  withToolProvenanceKey,
} from './mcpToolProvenance'

const entry = (generationId: string, fields?: string[]) => ({
  origin: 'ai_generated',
  contentVersion: 1,
  generationId,
  generatedAt: '2026-11-13T10:00:00Z',
  generator: 'agent-chat',
  model: 'gpt-4o-mini',
  reviewStatus: 'reviewed',
  ...(fields ? { aiGeneratedFields: fields } : {}),
})

const envelope = (generationId: string) => ({
  mixins: { provenance: [entry(generationId)] },
  metadata: { mixins: { provenance: PROVENANCE_SCHEMA_URL } },
})

describe('mcp tool provenance index', () => {
  it('stamps the tool index at save and leaves a deleted tool unmarked', () => {
    const generated = envelope('gen-1')

    expect(
      stampToolProvenance(generated, 'tool-b', ['tool-a', 'tool-b'])
    ).toEqual({
      ...generated,
      mixins: {
        provenance: [{ ...entry('gen-1'), aiGeneratedFields: ['tools[1]'] }],
      },
    })
    expect(stampToolProvenance(generated, 'tool-b', ['tool-a'])).toBe(generated)
    expect(stampToolProvenance(generated, undefined, ['tool-a'])).toBe(
      generated
    )
  })

  it('keeps the same tool when an earlier tool is removed', () => {
    const mixins = {
      provenance: { entries: [entry('gen-1', ['tools[2]'])] },
    }

    expect(
      rebaseStoredToolProvenance(mixins, ['a', 'b', 'c'], ['b', 'c'])
    ).toEqual({
      provenance: { entries: [entry('gen-1', ['tools[1]'])] },
    })
  })

  it('leaves the index when a later tool is removed or one is appended', () => {
    const mixins = {
      provenance: { entries: [entry('gen-1', ['tools[1]'])] },
    }

    expect(
      rebaseStoredToolProvenance(mixins, ['a', 'b', 'c'], ['a', 'b'])
    ).toBe(mixins)
    expect(
      rebaseStoredToolProvenance(mixins, ['a', 'b'], ['a', 'b', 'd'])
    ).toBe(mixins)
  })

  it('drops the field when the marked tool is removed and keeps the entry', () => {
    const mixins = {
      provenance: { entries: [entry('gen-1', ['tools[1]', 'outputFormat'])] },
    }

    expect(rebaseStoredToolProvenance(mixins, ['a', 'b'], ['a'])).toEqual({
      provenance: {
        entries: [entry('gen-1', ['outputFormat'])],
      },
    })
    expect(
      rebaseStoredToolProvenance(
        { provenance: { entries: [entry('gen-1', ['tools[0]'])] } },
        ['a'],
        []
      )
    ).toEqual({
      provenance: { entries: [entry('gen-1')] },
    })
  })

  it('assigns a stable key once', () => {
    const tool = withToolProvenanceKey({ name: 'orders' })
    expect(withToolProvenanceKey(tool)).toBe(tool)
    expect(toolProvenanceField(0)).toBe('tools[0]')
  })
})
