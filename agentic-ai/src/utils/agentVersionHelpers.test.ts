import { describe, expect, it } from 'vitest'
import type { AgentWithVersions } from '../types/Agent'
import {
  buildAgentVersionRows,
  buildRollbackAgent,
  buildSplitDiffRows,
  diffAgentVersionConfigs,
  formatVersionAuthor,
  pickVersionedFields,
  type VersionedAgentConfig,
} from './agentVersionHelpers'

const liveAgent = (): AgentWithVersions => ({
  id: 'anti-fraud',
  name: { en: 'Anti Fraud' },
  description: { en: 'Detects fraud' },
  userPrompt: 'Analyse the return.',
  templatePrompt: 'You are a specialist.',
  outputFormat: 'json',
  triggers: [{ type: 'ENDPOINT', config: {} }],
  llmConfig: {
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 2000,
    provider: 'emporix_openai' as AgentWithVersions['llmConfig']['provider'],
    additionalParams: null,
  },
  mcpServers: [],
  nativeTools: [{ id: 'tool-a' }],
  agentCollaborations: [],
  maxRecursionLimit: 20,
  enableMemory: true,
  enabled: true,
  metadata: {
    version: 3,
    createdAt: '2026-06-01T10:00:00.000Z',
    modifiedAt: '2026-07-01T09:00:00.000Z',
    schema: null,
    mixins: {},
    modifiedBy: { id: 'client-1', type: 'EXTERNAL' },
    changeNote: 'Raised the model',
  },
  type: 'GENERIC',
  icon: 'shield',
  tags: ['security'],
  requiredScopes: ['employee'],
  versions: [
    {
      name: { en: 'Anti Fraud' },
      description: { en: 'Detects fraud' },
      userPrompt: 'Analyse the return.',
      templatePrompt: 'You are a specialist.',
      triggers: [{ type: 'ENDPOINT', config: {} }],
      llmConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        provider:
          'emporix_openai' as AgentWithVersions['llmConfig']['provider'],
        additionalParams: null,
      },
      nativeTools: [{ id: 'tool-a' }],
      mcpServers: [],
      agentCollaborations: [],
      maxRecursionLimit: 20,
      enableMemory: false,
      enabled: true,
      outputFormat: 'json',
      icon: 'shield',
      tags: ['security'],
      requiredScopes: ['employee'],
      metadata: {
        version: 2,
        modifiedAt: '2026-06-15T14:30:00.000Z',
        modifiedBy: {
          id: 'ada@acme.com',
          type: 'EMPLOYEE',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
      },
    },
    {
      userPrompt: 'Old prompt',
      metadata: {
        version: 1,
        modifiedAt: '2026-06-01T10:00:00.000Z',
        modifiedBy: { type: 'SYSTEM' },
        changeNote: 'Created from template',
      },
    },
  ],
})

describe('buildAgentVersionRows', () => {
  it('puts the live version first and keeps older snapshots', () => {
    const rows = buildAgentVersionRows(liveAgent())

    expect(rows.map((row) => row.version)).toEqual([3, 2, 1])
    expect(rows[0]?.isCurrent).toBe(true)
    expect(rows[1]?.isCurrent).toBe(false)
    expect(rows[0]?.changeNote).toBe('Raised the model')
    expect(rows[0]?.config.userPrompt).toBe('Analyse the return.')
    expect(rows[2]?.config.userPrompt).toBe('Old prompt')
  })

  it('returns only the current row when history is empty', () => {
    const agent = liveAgent()
    agent.versions = []

    const rows = buildAgentVersionRows(agent)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.isCurrent).toBe(true)
    expect(rows[0]?.version).toBe(3)
  })

  it('does not mutate the agent or its history', () => {
    const agent = liveAgent()
    const original = structuredClone(agent)

    buildAgentVersionRows(agent)
    pickVersionedFields(agent)

    expect(agent).toEqual(original)
  })
})

describe('buildRollbackAgent', () => {
  it('uses the snapshot config and the live version number', () => {
    const agent = liveAgent()
    const historical = buildAgentVersionRows(agent)[1]

    expect(historical).toBeDefined()
    if (!historical) {
      return
    }

    const payload = buildRollbackAgent(
      agent,
      historical,
      'Rolled back to version 2'
    )

    expect(payload?.id).toBe('anti-fraud')
    expect(payload?.userPrompt).toBe('Analyse the return.')
    expect(payload?.llmConfig.model).toBe('gpt-3.5-turbo')
    expect(payload?.enableMemory).toBe(false)
    expect(payload?.metadata.version).toBe(3)
    expect(payload?.metadata.changeNote).toBe('Rolled back to version 2')
    expect(payload?.metadata.modifiedBy).toBeUndefined()
  })

  it('returns null when the snapshot has no model config', () => {
    const agent = liveAgent()
    const incomplete = buildAgentVersionRows(agent)[2]

    expect(incomplete).toBeDefined()
    if (!incomplete) {
      return
    }

    expect(
      buildRollbackAgent(agent, incomplete, 'Rolled back to version 1')
    ).toBeNull()
  })

  it('does not mutate the live agent or the selected row', () => {
    const agent = liveAgent()
    const historical = buildAgentVersionRows(agent)[1]
    const originalAgent = structuredClone(agent)
    const originalRow = structuredClone(historical)

    if (!historical) {
      return
    }

    buildRollbackAgent(agent, historical, 'Rolled back to version 2')

    expect(agent).toEqual(originalAgent)
    expect(historical).toEqual(originalRow)
  })
})

describe('formatVersionAuthor', () => {
  it('prefers first and last name', () => {
    expect(
      formatVersionAuthor(
        {
          id: 'ada@acme.com',
          type: 'EMPLOYEE',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
        'System'
      )
    ).toBe('Ada Lovelace')
  })

  it('falls back to id when names are missing', () => {
    expect(
      formatVersionAuthor({ id: 'cust-9', type: 'CUSTOMER' }, 'System')
    ).toBe('cust-9')
  })

  it('uses the system label when a system update has no id', () => {
    expect(formatVersionAuthor({ type: 'SYSTEM' }, 'System')).toBe('System')
  })

  it('returns an empty string when the author is missing', () => {
    expect(formatVersionAuthor(undefined, 'System')).toBe('')
  })
})

describe('buildSplitDiffRows', () => {
  it('aligns changed lines and marks only the words that differ', () => {
    const rows = buildSplitDiffRows(
      'Analyse the return.',
      'Analyse the request.'
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.left?.tone).toBe('remove')
    expect(rows[0]?.right?.tone).toBe('add')
    expect(rows[0]?.left?.parts).toEqual([
      { text: 'Analyse the ', changed: false },
      { text: 'return', changed: true },
      { text: '.', changed: false },
    ])
    expect(rows[0]?.right?.parts).toEqual([
      { text: 'Analyse the ', changed: false },
      { text: 'request', changed: true },
      { text: '.', changed: false },
    ])
  })

  it('marks a trailing space on an otherwise equal line', () => {
    const rows = buildSplitDiffRows('---\n', '--- \n')

    expect(rows).toHaveLength(1)
    expect(rows[0]?.right?.parts).toEqual([
      { text: '---', changed: false },
      { text: '·', changed: true },
    ])
  })

  it('marks a trailing space on a JSON line', () => {
    const rows = buildSplitDiffRows('  ],', '  ], ')

    expect(rows).toHaveLength(1)
    expect(
      rows[0]?.right?.parts.some((part) => part.changed && part.text === '·')
    ).toBe(true)
  })

  it('does not mutate the input strings', () => {
    const selected = 'Keep this prompt'
    const current = 'Keep that prompt'
    buildSplitDiffRows(selected, current)
    expect(selected).toBe('Keep this prompt')
    expect(current).toBe('Keep that prompt')
  })
})

describe('diffAgentVersionConfigs', () => {
  it('omits unchanged fields and reports changed objects and arrays', () => {
    const rows = buildAgentVersionRows(liveAgent())
    const current = rows[0]?.config
    const selected = rows[1]?.config

    expect(current).toBeDefined()
    expect(selected).toBeDefined()
    if (!current || !selected) {
      return
    }

    const diffs = diffAgentVersionConfigs(selected, current)
    const fields = diffs.map((diff) => diff.field)

    expect(fields).toEqual(['llmConfig', 'enableMemory'])
    expect(diffs.find((diff) => diff.field === 'llmConfig')?.kind).toBe('json')
    expect(diffs.find((diff) => diff.field === 'enableMemory')).toEqual({
      field: 'enableMemory',
      selected: 'false',
      current: 'true',
      kind: 'text',
      rows: [
        {
          left: {
            parts: [{ text: 'false', changed: true }],
            tone: 'remove',
          },
          right: {
            parts: [{ text: 'true', changed: true }],
            tone: 'add',
          },
        },
      ],
    })
    expect(fields).not.toContain('userPrompt')
    expect(fields).not.toContain('tags')
  })

  it('renders a null field as the text null', () => {
    const diffs = diffAgentVersionConfigs(
      { userPrompt: null } as unknown as VersionedAgentConfig,
      { userPrompt: 'Analyse the return.' }
    )

    expect(diffs).toHaveLength(1)
    expect(diffs[0]?.selected).toBe('null')
    expect(diffs[0]?.rows[0]?.left?.parts).toEqual([
      { text: 'null', changed: true },
    ])
    expect(diffs[0]?.rows[0]?.left?.parts[0]?.text).not.toBe('')
  })

  it('treats two nulls as equal and a missing field as empty', () => {
    expect(
      diffAgentVersionConfigs(
        { userPrompt: null } as unknown as VersionedAgentConfig,
        { userPrompt: null } as unknown as VersionedAgentConfig
      )
    ).toEqual([])

    const missing = diffAgentVersionConfigs(
      { userPrompt: null } as unknown as VersionedAgentConfig,
      {}
    )
    expect(missing[0]?.selected).toBe('null')
    expect(missing[0]?.current).toBe('')
  })

  it('treats object key order as unchanged', () => {
    const diffs = diffAgentVersionConfigs(
      { name: { de: 'Betrug', en: 'Fraud' } },
      { name: { en: 'Fraud', de: 'Betrug' } }
    )

    expect(diffs).toEqual([])
  })

  it('detects array changes', () => {
    const diffs = diffAgentVersionConfigs(
      { nativeTools: [{ id: 'tool-a' }] },
      { nativeTools: [{ id: 'tool-b' }] }
    )

    expect(diffs).toHaveLength(1)
    expect(diffs[0]?.field).toBe('nativeTools')
    expect(diffs[0]?.kind).toBe('json')

    const leftParts = diffs[0]?.rows.flatMap((row) => row.left?.parts ?? [])
    const rightParts = diffs[0]?.rows.flatMap((row) => row.right?.parts ?? [])

    expect(
      leftParts?.some((part) => part.changed && part.text.includes('a'))
    ).toBe(true)
    expect(
      rightParts?.some((part) => part.changed && part.text.includes('b'))
    ).toBe(true)
    expect(
      leftParts?.some((part) => !part.changed && part.text.includes('"id"'))
    ).toBe(true)
  })

  it('does not mutate the configs it compares', () => {
    const selected = {
      llmConfig: {
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        provider:
          'emporix_openai' as AgentWithVersions['llmConfig']['provider'],
        additionalParams: { z: 1, a: 2 },
      },
    }
    const current = {
      llmConfig: {
        provider:
          'emporix_openai' as AgentWithVersions['llmConfig']['provider'],
        additionalParams: { a: 2, z: 1 },
        maxTokens: 1000,
        model: 'gpt-4o',
      },
    }
    const originalSelected = structuredClone(selected)
    const originalCurrent = structuredClone(current)

    diffAgentVersionConfigs(selected, current)

    expect(selected).toEqual(originalSelected)
    expect(current).toEqual(originalCurrent)
  })
})
