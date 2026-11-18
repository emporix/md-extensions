import { describe, expect, it } from 'vitest'
import {
  PROVENANCE_SCHEMA_URL,
  appendAppliedProvenance,
  agentSaveMixins,
  readProvenanceEnvelope,
  withAiGeneratedFields,
  type ProvenanceCarrier,
} from './aiProvenance'

const entry = (
  generationId: string,
  contentVersion = 1,
  generatorVersion?: number
) => ({
  origin: 'ai_generated',
  contentVersion,
  generationId,
  generatedAt: '2026-11-13T10:00:00Z',
  generator: 'text',
  ...(generatorVersion === undefined ? {} : { generatorVersion }),
  model: 'gpt-4o-mini',
  reviewStatus: 'not_reviewed',
})

const accepted = <T extends { reviewStatus: string }>(value: T): T => ({
  ...value,
  reviewStatus: 'reviewed',
})

const envelope = (generationId: string, generatorVersion?: number) => ({
  mixins: { provenance: [entry(generationId, 1, generatorVersion)] },
  metadata: { mixins: { provenance: PROVENANCE_SCHEMA_URL } },
})

describe('appendAppliedProvenance', () => {
  it('sets content version to the next entity version on update', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 4, mixins: {} } },
      [envelope('gen-1', 3)],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [accepted(entry('gen-1', 5, 3))],
    })
    expect(saved.metadata?.mixins?.provenance).toBe(PROVENANCE_SCHEMA_URL)
  })

  it('starts create provenance at content version 1', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {},
      [envelope('gen-1')],
      'create'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [accepted(entry('gen-1', 1))],
    })
    expect(saved.metadata?.mixins?.provenance).toBe(PROVENANCE_SCHEMA_URL)
  })

  it('keeps previous history and appends each applied generation once', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: {
          color: { value: 'red' },
          provenance: { entries: [entry('old', 2)] },
        },
        metadata: { version: 2, mixins: { color: 'https://schema' } },
      },
      [envelope('gen-a'), envelope('gen-b'), envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.color).toEqual({ value: 'red' })
    expect(saved.mixins?.provenance).toEqual({
      entries: [
        entry('old', 2),
        accepted(entry('gen-a', 3)),
        accepted(entry('gen-b', 3)),
      ],
    })
    expect(saved.metadata?.mixins).toEqual({
      color: 'https://schema',
      provenance: PROVENANCE_SCHEMA_URL,
    })
  })

  it('keeps stored entries that do not match the response shape', () => {
    const legacy = { generationId: 'old', note: 'keep' }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [legacy] } },
        metadata: { version: 2 },
      },
      [envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [legacy, accepted(entry('gen-a', 3))],
    })
  })

  it('drops an older entry when a later run generates the same field', () => {
    const older = {
      ...entry('gen-old', 21),
      reviewStatus: 'reviewed',
      aiGeneratedFields: ['outputFormat'],
    }
    const kept = {
      ...entry('gen-other', 21),
      reviewStatus: 'reviewed',
      aiGeneratedFields: ['triggers.config.filter'],
    }
    const shared = {
      ...entry('gen-shared', 21),
      reviewStatus: 'reviewed',
      aiGeneratedFields: ['outputFormat', 'description.en'],
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [older, kept, shared] } },
        metadata: { version: 21 },
      },
      [
        {
          mixins: {
            provenance: [
              { ...entry('gen-new'), aiGeneratedFields: ['outputFormat'] },
            ],
          },
        },
      ],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        kept,
        { ...shared, aiGeneratedFields: ['description.en'] },
        accepted({
          ...entry('gen-new', 22),
          aiGeneratedFields: ['outputFormat'],
        }),
      ],
    })
  })

  it('keeps only the latest generation when the same field is generated twice', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 7 } },
      [
        {
          mixins: {
            provenance: [
              { ...entry('gen-old'), aiGeneratedFields: ['tools[1]'] },
            ],
          },
        },
        {
          mixins: {
            provenance: [
              { ...entry('gen-new'), aiGeneratedFields: ['tools[1]'] },
            ],
          },
        },
      ],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        accepted({
          ...entry('gen-new', 8),
          aiGeneratedFields: ['tools[1]'],
        }),
      ],
    })
  })

  it('drops only the regenerated field from an earlier generation in the same save', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 7 } },
      [
        {
          mixins: {
            provenance: [
              {
                ...entry('gen-old'),
                aiGeneratedFields: ['tools[0]', 'tools[1]'],
              },
            ],
          },
        },
        {
          mixins: {
            provenance: [
              { ...entry('gen-new'), aiGeneratedFields: ['tools[1]'] },
            ],
          },
        },
      ],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        accepted({
          ...entry('gen-old', 8),
          aiGeneratedFields: ['tools[0]'],
        }),
        accepted({
          ...entry('gen-new', 8),
          aiGeneratedFields: ['tools[1]'],
        }),
      ],
    })
  })

  it('keeps the later stored entry when the same field was saved twice', () => {
    const older = {
      ...entry('gen-old', 8),
      reviewStatus: 'reviewed',
      aiGeneratedFields: ['tools[1]'],
    }
    const newer = {
      ...entry('gen-new', 8),
      reviewStatus: 'reviewed',
      generatedAt: '2026-11-18T20:19:09.961Z',
      aiGeneratedFields: ['tools[1]'],
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [older, newer] } },
        metadata: { version: 8 },
      },
      [null],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [newer],
    })
  })

  it('appends the same generation id again on a later save', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [entry('gen-a', 3)] } },
        metadata: { version: 3 },
      },
      [envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [entry('gen-a', 3), accepted(entry('gen-a', 4))],
    })
  })

  it('keeps aiGeneratedFields and drops properties outside the provenance schema', () => {
    const generated = {
      ...entry('gen-1'),
      traceId: 'trace-1',
      aiGeneratedFields: ['description'],
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 4 } },
      [{ mixins: { provenance: [generated] } }],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        accepted({ ...entry('gen-1', 5), aiGeneratedFields: ['description'] }),
      ],
    })
  })

  it('refuses an update when the entity version is missing', () => {
    expect(() =>
      appendAppliedProvenance({}, [envelope('gen-1')], 'update')
    ).toThrow('metadata.version is required to append provenance on update')
  })

  it('keeps history already stored as the schema object', () => {
    const legacy = { generationId: 'old', note: 'keep' }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [legacy] } },
        metadata: { version: 2 },
      },
      [envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [legacy, accepted(entry('gen-a', 3))],
    })
  })

  it('drops a stored array because it is not the provenance schema', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: [entry('old', 2)] },
        metadata: { version: 2 },
      },
      [envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [accepted(entry('gen-a', 3))],
    })
  })

  it('shortens generatedAt to milliseconds', () => {
    const generated = {
      ...entry('gen-1'),
      generatedAt: '2026-11-17T17:37:35.765495933Z',
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 4 } },
      [{ mixins: { provenance: [generated] } }],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        accepted({
          ...entry('gen-1', 5),
          generatedAt: '2026-11-17T17:37:35.765Z',
        }),
      ],
    })
  })

  it('shortens a stored generatedAt that has more than millisecond precision', () => {
    const stored = {
      ...entry('old', 2),
      generatedAt: '2026-11-17T17:37:35.765495933Z',
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [stored] } },
        metadata: { version: 2 },
      },
      [envelope('gen-a')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        { ...stored, generatedAt: '2026-11-17T17:37:35.765Z' },
        accepted(entry('gen-a', 3)),
      ],
    })
  })

  it('leaves a schema object unchanged when nothing was applied', () => {
    const entity = {
      mixins: { provenance: { entries: [entry('old', 2)] } },
      metadata: { version: 2, mixins: {} },
    }

    expect(appendAppliedProvenance(entity, [null, undefined], 'update')).toBe(
      entity
    )
  })
})

describe('withAiGeneratedFields', () => {
  it('stamps the fields the view wrote and leaves an empty list unchanged', () => {
    const generated = envelope('gen-schema')

    expect(withAiGeneratedFields(generated, ['outputFormat'])).toEqual({
      ...generated,
      mixins: {
        provenance: [
          { ...entry('gen-schema'), aiGeneratedFields: ['outputFormat'] },
        ],
      },
    })
    expect(withAiGeneratedFields(generated, [])).toBe(generated)
    expect(withAiGeneratedFields(null, ['outputFormat'])).toBeNull()
  })

  it('keeps each generation field list on one save', () => {
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      { metadata: { version: 4 } },
      [
        withAiGeneratedFields(envelope('gen-schema'), ['outputFormat']),
        withAiGeneratedFields(envelope('gen-filter'), [
          'triggers.config.filter',
        ]),
      ],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        accepted({
          ...entry('gen-schema', 5),
          aiGeneratedFields: ['outputFormat'],
        }),
        accepted({
          ...entry('gen-filter', 5),
          aiGeneratedFields: ['triggers.config.filter'],
        }),
      ],
    })
  })
})

describe('readProvenanceEnvelope', () => {
  it('keeps response fields and ignores malformed entries', () => {
    const envelope = readProvenanceEnvelope({
      result: 'text',
      mixins: {
        provenance: [entry('gen-1', 1, 2), { generationId: 4 }],
      },
      metadata: { mixins: { provenance: PROVENANCE_SCHEMA_URL } },
    })

    expect(envelope?.mixins?.provenance).toEqual([entry('gen-1', 1, 2)])
    expect(envelope?.metadata?.mixins?.provenance).toBe(PROVENANCE_SCHEMA_URL)
  })
})

describe('agentSaveMixins', () => {
  it('keeps stored mixins on the save payload and omits them when the agent has none', () => {
    const stored = {
      provenance: { entries: [entry('old', 4)] },
      color: { value: 'red' },
    }

    expect(agentSaveMixins(stored)).toEqual({ mixins: stored })
    expect(agentSaveMixins(undefined)).toEqual({})
  })
})
