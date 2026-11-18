import {
  appendAppliedProvenance as appendProvenance,
  type ProvenanceApplied,
  type ProvenanceCarrier,
  type ProvenanceEntry,
  type ProvenanceEnvelope,
} from '@emporix/api-calls/next'

export {
  PROVENANCE_SCHEMA_URL,
  readProvenanceEnvelope,
  type ProvenanceCarrier,
  type ProvenanceEnvelope,
} from '@emporix/api-calls/next'

const GENERATED_AT =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})$/

const generatedAtForSchema = (value: string): string => {
  const match = GENERATED_AT.exec(value)
  if (!match || match[2] === undefined || match[2].length === 3) {
    return value
  }
  return `${match[1]}.${match[2].slice(0, 3).padEnd(3, '0')}${match[3]}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeUnknownEntry = (entry: unknown): unknown => {
  if (!isRecord(entry) || typeof entry.generatedAt !== 'string') {
    return entry
  }
  const generatedAt = generatedAtForSchema(entry.generatedAt)
  return generatedAt === entry.generatedAt ? entry : { ...entry, generatedAt }
}

const REVIEWED = 'reviewed'

const normalizeEntries = (entries: readonly unknown[]): unknown[] | null => {
  let changed = false
  const next = entries.map((entry) => {
    const normalized = normalizeUnknownEntry(entry)
    if (normalized !== entry) {
      changed = true
    }
    return normalized
  })
  return changed ? next : null
}

const prepareAppliedEntry = (entry: unknown): unknown => {
  const dated = normalizeUnknownEntry(entry)
  if (!isRecord(dated) || dated.reviewStatus === REVIEWED) {
    return dated
  }
  return { ...dated, reviewStatus: REVIEWED }
}

const prepareAppliedEntries = (
  entries: readonly unknown[]
): unknown[] | null => {
  let changed = false
  const next = entries.map((entry) => {
    const prepared = prepareAppliedEntry(entry)
    if (prepared !== entry) {
      changed = true
    }
    return prepared
  })
  return changed ? next : null
}

const normalizeApplied = (applied: ProvenanceApplied): ProvenanceApplied => {
  const provenance = applied.mixins?.provenance
  if (Array.isArray(provenance)) {
    const entries = prepareAppliedEntries(provenance)
    if (!entries) {
      return applied
    }
    return {
      ...applied,
      mixins: { ...applied.mixins, provenance: entries as ProvenanceEntry[] },
    }
  }
  if (isRecord(provenance) && Array.isArray(provenance.entries)) {
    const entries = prepareAppliedEntries(provenance.entries)
    if (!entries) {
      return applied
    }
    return {
      ...applied,
      mixins: {
        ...applied.mixins,
        provenance: { ...provenance, entries: entries as ProvenanceEntry[] },
      },
    }
  }
  return applied
}

const normalizeCarrier = <T extends ProvenanceCarrier>(entity: T): T => {
  const provenance = entity.mixins?.provenance
  if (!isRecord(provenance) || !Array.isArray(provenance.entries)) {
    return entity
  }
  const entries = normalizeEntries(provenance.entries)
  if (!entries) {
    return entity
  }
  return {
    ...entity,
    mixins: {
      ...entity.mixins,
      provenance: { ...provenance, entries },
    },
  }
}

export const withAiGeneratedFields = (
  envelope: ProvenanceEnvelope | null,
  fields: readonly string[]
): ProvenanceEnvelope | null => {
  const names = fields.filter((field) => field.trim().length > 0)
  const provenance = envelope?.mixins?.provenance
  if (!envelope || names.length === 0 || !Array.isArray(provenance)) {
    return envelope
  }
  return {
    ...envelope,
    mixins: {
      ...envelope.mixins,
      provenance: provenance.map((entry) => ({
        ...entry,
        aiGeneratedFields: [...names],
      })),
    },
  }
}

export const appendAppliedProvenance = <T extends ProvenanceCarrier>(
  entity: T,
  applied: readonly (ProvenanceApplied | null | undefined)[],
  mode: 'create' | 'update'
): T =>
  appendProvenance(
    normalizeCarrier(entity),
    applied.map((item) => (item ? normalizeApplied(item) : item)),
    mode
  )

export const pendingAfterScopeChange = <T>(
  pending: readonly T[],
  previousScope: string | undefined,
  nextScope: string | undefined
): T[] => (previousScope === nextScope ? [...pending] : [])

export const agentSaveMixins = (
  stored: Record<string, unknown> | undefined
): { mixins?: Record<string, unknown> } => (stored ? { mixins: stored } : {})
