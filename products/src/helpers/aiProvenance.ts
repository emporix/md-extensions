import {
  PROVENANCE_MIXIN,
  appendAppliedProvenance as appendProvenance,
  type ProvenanceApplied,
  type ProvenanceCarrier,
  type ProvenanceEntry,
  type ProvenanceEnvelope,
} from '@emporix/api-calls/next'

export {
  PROVENANCE_MIXIN,
  PROVENANCE_SCHEMA_URL,
  readProvenanceEnvelope,
  type ProvenanceCarrier,
  type ProvenanceEnvelope,
  type ProvenanceEntry,
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

const appliedFieldNames = (
  applied: readonly (ProvenanceApplied | null | undefined)[]
): Set<string> => {
  const names = new Set<string>()
  for (const item of applied) {
    const provenance = item?.mixins?.provenance
    const entries = Array.isArray(provenance)
      ? provenance
      : isRecord(provenance) && Array.isArray(provenance.entries)
        ? provenance.entries
        : []
    for (const entry of entries) {
      if (!isRecord(entry) || !Array.isArray(entry.aiGeneratedFields)) {
        continue
      }
      for (const field of entry.aiGeneratedFields) {
        if (typeof field === 'string' && field.length > 0) {
          names.add(field)
        }
      }
    }
  }
  return names
}

const withoutSupersededFields = <T extends ProvenanceCarrier>(
  entity: T,
  applied: readonly (ProvenanceApplied | null | undefined)[],
  mode: 'create' | 'update'
): T => {
  if (mode !== 'update') {
    return entity
  }
  const superseded = appliedFieldNames(applied)
  const provenance = entity.mixins?.provenance
  if (
    superseded.size === 0 ||
    !isRecord(provenance) ||
    !Array.isArray(provenance.entries)
  ) {
    return entity
  }
  let changed = false
  const entries: unknown[] = []
  for (const entry of provenance.entries) {
    if (!isRecord(entry) || !Array.isArray(entry.aiGeneratedFields)) {
      entries.push(entry)
      continue
    }
    const fields = entry.aiGeneratedFields.filter(
      (field): field is string => typeof field === 'string'
    )
    if (!fields.some((field) => superseded.has(field))) {
      entries.push(entry)
      continue
    }
    changed = true
    const remaining = fields.filter((field) => !superseded.has(field))
    if (remaining.length === 0) {
      continue
    }
    entries.push({ ...entry, aiGeneratedFields: remaining })
  }
  if (!changed) {
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

export const appendAppliedProvenance = <T extends ProvenanceCarrier>(
  entity: T,
  applied: readonly (ProvenanceApplied | null | undefined)[],
  mode: 'create' | 'update'
): T => {
  const normalized = applied.map((item) =>
    item ? normalizeApplied(item) : item
  )
  return appendProvenance(
    withoutSupersededFields(normalizeCarrier(entity), normalized, mode),
    normalized,
    mode
  )
}

export const provenanceForSelectedRows = (
  rows: readonly {
    selected: boolean
    provenance?: ProvenanceEnvelope | null
  }[]
): ProvenanceEnvelope[] =>
  rows.flatMap((row) =>
    row.selected && row.provenance ? [row.provenance] : []
  )

export const pendingProvenanceAfterDiscard = (): ProvenanceEnvelope[] => []

export const pendingProvenanceForProduct = <T>(
  pending: readonly T[],
  previousId: string | undefined,
  nextId: string | undefined
): readonly T[] =>
  previousId !== undefined && previousId !== nextId ? [] : pending

export const productFormKeepsDirtyValues = (
  previousId: string | undefined,
  nextId: string | undefined,
  fullReset: boolean
): boolean => {
  if (fullReset) {
    return false
  }
  return previousId === undefined || previousId === nextId
}

const storedEntries = (value: unknown): unknown[] =>
  isRecord(value) && Array.isArray(value.entries) ? value.entries : []

export const productProvenanceForSave = <T extends ProvenanceCarrier>(
  payload: T,
  source: ProvenanceCarrier | undefined,
  applied: readonly (ProvenanceEnvelope | null | undefined)[],
  mode: 'create' | 'update'
): T => {
  if (mode === 'create' || !source) {
    return appendAppliedProvenance(payload, applied, mode)
  }
  const sourceProvenance = source.mixins?.[PROVENANCE_MIXIN]
  const mixins = { ...(payload.mixins ?? source.mixins ?? {}) }
  if (
    storedEntries(mixins[PROVENANCE_MIXIN]).length === 0 &&
    storedEntries(sourceProvenance).length > 0
  ) {
    mixins[PROVENANCE_MIXIN] = sourceProvenance
  }
  const version =
    typeof payload.metadata?.version === 'number'
      ? payload.metadata.version
      : source.metadata?.version
  return appendAppliedProvenance(
    {
      ...payload,
      mixins,
      metadata: {
        ...payload.metadata,
        ...(typeof version === 'number' ? { version } : {}),
      },
    },
    applied,
    mode
  )
}
