import { describe, expect, it } from 'vitest'
import { CustomAgent } from '../types/Agent'
import {
  areCollaborationsValid,
  buildCollaboration,
  filterCollaborationAgentOptions,
  getCollaborationRows,
  getUsedCollaborationAgentIds,
  getUsedCollaborationAgentIdsExcludingRow,
  getValidCollaborations,
  isCollaborationAgentAllowed,
  isCollaborationPromptMissing,
  isCollaborationRowValid,
  isEmptyCollaborationRow,
} from './agentCollaborationHelpers'

const agents: CustomAgent[] = [
  {
    id: 'agent-a',
    name: { en: 'Agent A' },
    description: { en: '' },
    userPrompt: '',
    triggers: [],
    llmConfig: {} as CustomAgent['llmConfig'],
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    maxRecursionLimit: 10,
    enableMemory: false,
    enabled: true,
    metadata: {} as CustomAgent['metadata'],
    type: 'custom',
  },
  {
    id: 'agent-b',
    name: { en: 'Agent B' },
    description: { en: '' },
    userPrompt: '',
    triggers: [],
    llmConfig: {} as CustomAgent['llmConfig'],
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    maxRecursionLimit: 10,
    enableMemory: false,
    enabled: true,
    metadata: {} as CustomAgent['metadata'],
    type: 'custom',
  },
  {
    id: 'emporix--collaboration',
    name: { en: 'Emporix Collaboration' },
    description: { en: '' },
    userPrompt: '',
    triggers: [],
    llmConfig: {} as CustomAgent['llmConfig'],
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    maxRecursionLimit: 10,
    enableMemory: false,
    enabled: true,
    metadata: {} as CustomAgent['metadata'],
    type: 'custom',
  },
]

describe('agentCollaborationHelpers', () => {
  it('isCollaborationRowValid requires agent and prompt', () => {
    expect(isCollaborationRowValid('agent-a', 'Hand off')).toBe(true)
    expect(isCollaborationRowValid('agent-a', '   ')).toBe(false)
    expect(isCollaborationRowValid(null, 'Hand off')).toBe(false)
  })

  it('buildCollaboration trims prompt into description', () => {
    expect(buildCollaboration('agent-a', '  Route to support  ')).toEqual({
      agentId: 'agent-a',
      description: 'Route to support',
    })
  })

  it('isCollaborationAgentAllowed filters emporix collaboration by agent type', () => {
    const emporixAgent = agents[2]

    expect(isCollaborationAgentAllowed(emporixAgent, 'complaint')).toBe(true)
    expect(isCollaborationAgentAllowed(emporixAgent, 'anti_fraud')).toBe(true)
    expect(isCollaborationAgentAllowed(emporixAgent, 'custom')).toBe(false)
  })

  it('filterCollaborationAgentOptions excludes current and used agents', () => {
    const filtered = filterCollaborationAgentOptions(
      agents,
      'agent-a',
      ['agent-b'],
      'custom'
    )

    expect(filtered.map((agent) => agent.id)).toEqual([])
  })

  it('filterCollaborationAgentOptions keeps editing agent available', () => {
    const filtered = filterCollaborationAgentOptions(
      agents,
      'agent-a',
      ['agent-b'],
      'custom',
      'agent-b'
    )

    expect(filtered.map((agent) => agent.id)).toEqual(['agent-b'])
  })

  it('getUsedCollaborationAgentIds returns non-empty agent ids', () => {
    expect(
      getUsedCollaborationAgentIds([
        { agentId: 'agent-a', description: 'A' },
        { agentId: '', description: 'Draft' },
        { agentId: 'agent-b', description: 'B' },
      ])
    ).toEqual(['agent-a', 'agent-b'])
  })

  it('getValidCollaborations keeps only complete rows', () => {
    expect(
      getValidCollaborations([
        { agentId: 'agent-a', description: 'Hand off' },
        { agentId: '', description: 'Draft' },
        { agentId: 'agent-b', description: '   ' },
      ])
    ).toEqual([{ agentId: 'agent-a', description: 'Hand off' }])
  })

  it('getCollaborationRows returns one empty row when list is empty', () => {
    expect(getCollaborationRows([])).toEqual([{ agentId: '', description: '' }])
  })

  it('getCollaborationRows appends empty row when last row has agent selected', () => {
    expect(
      getCollaborationRows([{ agentId: 'agent-a', description: 'Hand off' }])
    ).toEqual([
      { agentId: 'agent-a', description: 'Hand off' },
      { agentId: '', description: '' },
    ])
    expect(
      getCollaborationRows([{ agentId: 'agent-a', description: '' }])
    ).toEqual([
      { agentId: 'agent-a', description: '' },
      { agentId: '', description: '' },
    ])
  })

  it('isEmptyCollaborationRow detects rows without agent or prompt', () => {
    expect(isEmptyCollaborationRow({ agentId: '', description: '' })).toBe(true)
    expect(
      isEmptyCollaborationRow({ agentId: 'agent-a', description: '' })
    ).toBe(false)
    expect(
      isEmptyCollaborationRow({ agentId: '', description: 'Prompt' })
    ).toBe(false)
  })

  it('getUsedCollaborationAgentIdsExcludingRow omits the current row agent', () => {
    expect(
      getUsedCollaborationAgentIdsExcludingRow(
        [
          { agentId: 'agent-a', description: 'A' },
          { agentId: 'agent-b', description: 'B' },
        ],
        0
      )
    ).toEqual(['agent-b'])
  })

  it('isCollaborationPromptMissing is true when agent selected without prompt', () => {
    expect(isCollaborationPromptMissing('agent-a', '')).toBe(true)
    expect(isCollaborationPromptMissing('agent-a', 'Prompt')).toBe(false)
    expect(isCollaborationPromptMissing('', '')).toBe(false)
  })

  it('areCollaborationsValid requires prompt when agent is selected', () => {
    expect(
      areCollaborationsValid([{ agentId: 'agent-a', description: '' }])
    ).toBe(false)
    expect(
      areCollaborationsValid([
        { agentId: 'agent-a', description: 'Hand off' },
        { agentId: '', description: '' },
      ])
    ).toBe(true)
    expect(
      areCollaborationsValid([{ agentId: '', description: 'Orphan prompt' }])
    ).toBe(false)
  })
})
