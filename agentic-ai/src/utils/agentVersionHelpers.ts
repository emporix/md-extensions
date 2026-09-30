import { diffLines, diffWordsWithSpace } from 'diff'
import type {
  AgentVersion,
  AgentWithVersions,
  CustomAgent,
  LocalizedString,
  ModifiedBy,
} from '../types/Agent'

export const AGENT_VERSION_FIELDS = [
  'name',
  'description',
  'icon',
  'tags',
  'enabled',
  'requiredScopes',
  'templatePrompt',
  'userPrompt',
  'llmConfig',
  'triggers',
  'mcpServers',
  'nativeTools',
  'agentCollaborations',
  'maxRecursionLimit',
  'enableMemory',
  'outputFormat',
] as const

export type AgentVersionField = (typeof AGENT_VERSION_FIELDS)[number]

export type VersionedAgentConfig = Partial<
  Pick<AgentVersion, AgentVersionField>
>

export type AgentVersionRow = {
  readonly id: string
  readonly version: number
  readonly modifiedAt?: string
  readonly modifiedBy?: ModifiedBy
  readonly changeNote?: string
  readonly isCurrent: boolean
  readonly config: VersionedAgentConfig
}

export type TextDiffPart = {
  readonly text: string
  readonly changed: boolean
}

export type DiffCellTone = 'same' | 'remove' | 'add'

export type DiffCell = {
  readonly parts: readonly TextDiffPart[]
  readonly tone: DiffCellTone
} | null

export type DiffRow = {
  readonly left: DiffCell
  readonly right: DiffCell
}

export type AgentVersionFieldDiff = {
  readonly field: AgentVersionField
  readonly selected: string
  readonly current: string
  readonly rows: readonly DiffRow[]
  readonly kind: 'text' | 'json'
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((acc, key) => {
      const nested = value[key]
      if (nested !== undefined) {
        acc[key] = sortKeys(nested)
      }
      return acc
    }, {})
}

const isScalar = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const comparable = (value: unknown): string => {
  if (value === undefined) {
    return ''
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(sortKeys(value))
}

const displayValue = (value: unknown): string => {
  if (value === undefined) {
    return ''
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(sortKeys(value), null, 2)
}

const withVersionedField = <K extends AgentVersionField>(
  config: VersionedAgentConfig,
  key: K,
  value: VersionedAgentConfig[K]
): VersionedAgentConfig => {
  if (value === undefined) {
    return config
  }

  return { ...config, [key]: value }
}

export const pickVersionedFields = (
  source: AgentWithVersions | AgentVersion
): VersionedAgentConfig => {
  let config: VersionedAgentConfig = {}
  config = withVersionedField(config, 'name', source.name)
  config = withVersionedField(config, 'description', source.description)
  config = withVersionedField(config, 'icon', source.icon)
  config = withVersionedField(config, 'tags', source.tags)
  config = withVersionedField(config, 'enabled', source.enabled)
  config = withVersionedField(config, 'requiredScopes', source.requiredScopes)
  config = withVersionedField(config, 'templatePrompt', source.templatePrompt)
  config = withVersionedField(config, 'userPrompt', source.userPrompt)
  config = withVersionedField(config, 'llmConfig', source.llmConfig)
  config = withVersionedField(config, 'triggers', source.triggers)
  config = withVersionedField(config, 'mcpServers', source.mcpServers)
  config = withVersionedField(config, 'nativeTools', source.nativeTools)
  config = withVersionedField(
    config,
    'agentCollaborations',
    source.agentCollaborations
  )
  config = withVersionedField(
    config,
    'maxRecursionLimit',
    source.maxRecursionLimit
  )
  config = withVersionedField(config, 'enableMemory', source.enableMemory)
  config = withVersionedField(config, 'outputFormat', source.outputFormat)
  return config
}

const hasLocalizedValue = (
  value: LocalizedString | undefined
): value is LocalizedString =>
  !!value && Object.values(value).some((entry) => entry.trim().length > 0)

export const buildRollbackAgent = (
  live: AgentWithVersions,
  row: AgentVersionRow,
  changeNote: string
): CustomAgent | null => {
  const config = row.config
  const name = config.name
  const llmConfig = config.llmConfig
  const triggers = config.triggers
  const metadata = live.metadata
  const liveVersion = metadata?.version
  const userPrompt = config.userPrompt

  if (
    !metadata ||
    typeof liveVersion !== 'number' ||
    !hasLocalizedValue(name) ||
    !userPrompt?.trim() ||
    !triggers?.length ||
    !llmConfig?.model?.trim() ||
    !llmConfig.provider
  ) {
    return null
  }

  return {
    id: live.id,
    name,
    description: config.description ?? {},
    userPrompt,
    templatePrompt: config.templatePrompt,
    outputFormat: config.outputFormat,
    triggers,
    llmConfig,
    mcpServers: config.mcpServers ?? [],
    nativeTools: config.nativeTools ?? [],
    agentCollaborations: config.agentCollaborations ?? [],
    maxRecursionLimit: config.maxRecursionLimit ?? 20,
    enableMemory: config.enableMemory ?? false,
    enabled: config.enabled ?? false,
    metadata: {
      version: liveVersion,
      createdAt: metadata.createdAt,
      modifiedAt: metadata.modifiedAt,
      schema: metadata.schema,
      mixins: metadata.mixins ?? {},
      changeNote,
    },
    icon: config.icon,
    tags: config.tags ?? [],
    type: live.type,
    requiredScopes: config.requiredScopes ?? [],
  }
}

export const buildAgentVersionRows = (
  agent: AgentWithVersions
): AgentVersionRow[] => {
  const currentVersion = agent.metadata?.version ?? 0
  const current: AgentVersionRow = {
    id: `current-${currentVersion}`,
    version: currentVersion,
    modifiedAt: agent.metadata?.modifiedAt,
    modifiedBy: agent.metadata?.modifiedBy,
    changeNote: agent.metadata?.changeNote,
    isCurrent: true,
    config: pickVersionedFields(agent),
  }

  const historical = (agent.versions ?? []).map((snapshot, index) => {
    const version = snapshot.metadata?.version ?? 0
    return {
      id: `snapshot-${version}-${index}`,
      version,
      modifiedAt: snapshot.metadata?.modifiedAt,
      modifiedBy: snapshot.metadata?.modifiedBy,
      changeNote: snapshot.metadata?.changeNote,
      isCurrent: false,
      config: pickVersionedFields(snapshot),
    }
  })

  return [current, ...historical].sort((left, right) => {
    if (right.version !== left.version) {
      return right.version - left.version
    }

    if (left.isCurrent === right.isCurrent) {
      return 0
    }

    return left.isCurrent ? -1 : 1
  })
}

export const formatVersionAuthor = (
  modifiedBy: ModifiedBy | undefined,
  systemLabel: string
): string => {
  if (!modifiedBy) {
    return ''
  }

  const name = [modifiedBy.firstName, modifiedBy.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part)
    .join(' ')

  if (name) {
    return name
  }

  const id = modifiedBy.id?.trim()
  if (id) {
    return id
  }

  if (modifiedBy.type === 'SYSTEM') {
    return systemLabel
  }

  return ''
}

const mergeParts = (parts: readonly TextDiffPart[]): TextDiffPart[] => {
  const merged: TextDiffPart[] = []

  for (const part of parts) {
    const last = merged[merged.length - 1]
    if (last && last.changed === part.changed) {
      merged[merged.length - 1] = {
        text: last.text + part.text,
        changed: last.changed,
      }
      continue
    }
    merged.push(part)
  }

  return merged
}

const linesFromChunk = (chunk: string): string[] => {
  if (chunk === '') {
    return []
  }

  const lines = chunk.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines
}

const showWhitespace = (text: string): string =>
  text.replace(/ /g, '·').replace(/\t/g, '→')

const changedPart = (text: string): TextDiffPart => ({
  text: /^[ \t]+$/.test(text) ? showWhitespace(text) : text,
  changed: true,
})

const sameLineCell = (line: string): DiffCell => ({
  parts: [{ text: line, changed: false }],
  tone: 'same',
})

const wordDiffCells = (
  leftLine: string,
  rightLine: string
): { readonly left: DiffCell; readonly right: DiffCell } => {
  if (leftLine === rightLine) {
    const cell = sameLineCell(leftLine)
    return { left: cell, right: cell }
  }

  const leftParts: TextDiffPart[] = []
  const rightParts: TextDiffPart[] = []

  for (const change of diffWordsWithSpace(leftLine, rightLine)) {
    if (change.added) {
      rightParts.push(changedPart(change.value))
    } else if (change.removed) {
      leftParts.push(changedPart(change.value))
    } else {
      leftParts.push({ text: change.value, changed: false })
      rightParts.push({ text: change.value, changed: false })
    }
  }

  return {
    left: { parts: mergeParts(leftParts), tone: 'remove' },
    right: { parts: mergeParts(rightParts), tone: 'add' },
  }
}

const pushReplacementRows = (
  rows: DiffRow[],
  removed: string,
  added: string
): void => {
  const leftLines = linesFromChunk(removed)
  const rightLines = linesFromChunk(added)
  const count = Math.max(leftLines.length, rightLines.length)

  for (let index = 0; index < count; index += 1) {
    const leftLine = leftLines[index]
    const rightLine = rightLines[index]

    if (leftLine !== undefined && rightLine !== undefined) {
      const cells = wordDiffCells(leftLine, rightLine)
      rows.push({ left: cells.left, right: cells.right })
      continue
    }

    if (leftLine !== undefined) {
      rows.push({
        left: { parts: [changedPart(leftLine)], tone: 'remove' },
        right: null,
      })
      continue
    }

    if (rightLine !== undefined) {
      rows.push({
        left: null,
        right: { parts: [changedPart(rightLine)], tone: 'add' },
      })
    }
  }
}

export const buildSplitDiffRows = (
  selected: string,
  current: string
): DiffRow[] => {
  const rows: DiffRow[] = []
  const changes = diffLines(selected, current)
  let index = 0

  while (index < changes.length) {
    const change = changes[index]

    if (!change.added && !change.removed) {
      for (const line of linesFromChunk(change.value)) {
        const cell = sameLineCell(line)
        rows.push({ left: cell, right: cell })
      }
      index += 1
      continue
    }

    const next = changes[index + 1]
    if (change.removed && next?.added) {
      pushReplacementRows(rows, change.value, next.value)
      index += 2
      continue
    }

    if (change.removed) {
      for (const line of linesFromChunk(change.value)) {
        rows.push({
          left: { parts: [changedPart(line)], tone: 'remove' },
          right: null,
        })
      }
      index += 1
      continue
    }

    if (change.added) {
      for (const line of linesFromChunk(change.value)) {
        rows.push({
          left: null,
          right: { parts: [changedPart(line)], tone: 'add' },
        })
      }
    }

    index += 1
  }

  return rows
}

export const diffAgentVersionConfigs = (
  selected: VersionedAgentConfig,
  current: VersionedAgentConfig
): AgentVersionFieldDiff[] => {
  const diffs: AgentVersionFieldDiff[] = []

  for (const field of AGENT_VERSION_FIELDS) {
    const selectedValue = selected[field]
    const currentValue = current[field]
    if (comparable(selectedValue) === comparable(currentValue)) {
      continue
    }

    const selectedText = displayValue(selectedValue)
    const currentText = displayValue(currentValue)
    const kind =
      isScalar(selectedValue) && isScalar(currentValue) ? 'text' : 'json'
    diffs.push({
      field,
      selected: selectedText,
      current: currentText,
      rows: buildSplitDiffRows(selectedText, currentText),
      kind,
    })
  }

  return diffs
}
