import { withAiGeneratedFields, type ProvenanceEnvelope } from './aiProvenance'

const TOOL_PROVENANCE_FIELD = /^tools\[(\d+)\]$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const createToolProvenanceKey = (): string =>
  globalThis.crypto.randomUUID()

export const readToolProvenanceKey = (tool: object): string | undefined => {
  if (!('provenanceKey' in tool)) {
    return undefined
  }
  const key = tool.provenanceKey
  return typeof key === 'string' && key.length > 0 ? key : undefined
}

export const withToolProvenanceKey = <T extends object>(
  tool: T
): T & { provenanceKey: string } => {
  const existing = readToolProvenanceKey(tool)
  if (existing) {
    return tool as T & { provenanceKey: string }
  }
  return { ...tool, provenanceKey: createToolProvenanceKey() }
}

export const toolProvenanceField = (index: number): string => `tools[${index}]`

const rewriteToolFields = (
  fields: readonly string[],
  loadedKeys: readonly string[],
  currentKeys: readonly string[]
): { fields: string[]; changed: boolean } => {
  let changed = false
  const next: string[] = []
  for (const field of fields) {
    const match = TOOL_PROVENANCE_FIELD.exec(field)
    if (!match) {
      next.push(field)
      continue
    }
    const key = loadedKeys[Number(match[1])]
    const currentIndex = key ? currentKeys.indexOf(key) : -1
    if (!key || currentIndex < 0) {
      changed = true
      continue
    }
    const rewritten = toolProvenanceField(currentIndex)
    if (rewritten !== field) {
      changed = true
    }
    next.push(rewritten)
  }
  return { fields: next, changed }
}

export const rebaseStoredToolProvenance = (
  mixins: Record<string, unknown> | undefined,
  loadedKeys: readonly string[],
  currentKeys: readonly string[]
): Record<string, unknown> | undefined => {
  if (!mixins) {
    return mixins
  }
  const provenance = mixins.provenance
  if (!isRecord(provenance) || !Array.isArray(provenance.entries)) {
    return mixins
  }
  let changed = false
  const entries = provenance.entries.map((entry) => {
    if (!isRecord(entry) || !Array.isArray(entry.aiGeneratedFields)) {
      return entry
    }
    const fields = entry.aiGeneratedFields.filter(
      (field): field is string => typeof field === 'string'
    )
    const rewritten = rewriteToolFields(fields, loadedKeys, currentKeys)
    if (!rewritten.changed) {
      return entry
    }
    changed = true
    if (rewritten.fields.length === 0) {
      return Object.fromEntries(
        Object.entries(entry).filter(([key]) => key !== 'aiGeneratedFields')
      )
    }
    return { ...entry, aiGeneratedFields: rewritten.fields }
  })
  if (!changed) {
    return mixins
  }
  return {
    ...mixins,
    provenance: { ...provenance, entries },
  }
}

export const stampToolProvenance = (
  envelope: ProvenanceEnvelope | null,
  toolProvenanceKey: string | undefined,
  currentKeys: readonly string[]
): ProvenanceEnvelope | null => {
  if (!envelope || !toolProvenanceKey) {
    return null
  }
  const index = currentKeys.indexOf(toolProvenanceKey)
  if (index < 0) {
    return null
  }
  return withAiGeneratedFields(envelope, [toolProvenanceField(index)])
}
