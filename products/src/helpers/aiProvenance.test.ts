import { describe, expect, it } from 'vitest'
import {
  PROVENANCE_SCHEMA_URL,
  appendAppliedProvenance,
  pendingProvenanceAfterDiscard,
  pendingProvenanceForProduct,
  productFormKeepsDirtyValues,
  productProvenanceForSave,
  provenanceForSelectedRows,
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
      aiGeneratedFields: ['description.en'],
    }
    const kept = {
      ...entry('gen-other', 21),
      reviewStatus: 'reviewed',
      aiGeneratedFields: ['description.de'],
    }
    const saved: ProvenanceCarrier = appendAppliedProvenance(
      {
        mixins: { provenance: { entries: [older, kept] } },
        metadata: { version: 21 },
      },
      [
        {
          mixins: {
            provenance: [
              { ...entry('gen-new'), aiGeneratedFields: ['description.en'] },
            ],
          },
        },
      ],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [
        kept,
        accepted({
          ...entry('gen-new', 22),
          aiGeneratedFields: ['description.en'],
        }),
      ],
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

describe('provenanceForSelectedRows', () => {
  it('keeps provenance only for accepted suggestions', () => {
    const kept = envelope('kept')
    const dropped = envelope('dropped')

    expect(
      provenanceForSelectedRows([
        { selected: true, provenance: kept },
        { selected: false, provenance: dropped },
        { selected: true, provenance: null },
      ])
    ).toEqual([kept])
  })
})

describe('productProvenanceForSave', () => {
  it('uses the loaded product version and history when the payload omits them', () => {
    const legacy = { generationId: 'old', note: 'keep' }
    const saved: ProvenanceCarrier = productProvenanceForSave(
      { name: 'Chair' },
      {
        mixins: { provenance: { entries: [legacy] } },
        metadata: { version: 4 },
      },
      [envelope('gen-1')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [legacy, accepted(entry('gen-1', 5))],
    })
  })

  it('keeps history already stored as the schema object', () => {
    const legacy = { generationId: 'old', note: 'keep' }
    const saved: ProvenanceCarrier = productProvenanceForSave(
      { name: 'Chair' },
      {
        mixins: { provenance: { entries: [legacy] } },
        metadata: { version: 4 },
      },
      [envelope('gen-1')],
      'update'
    )

    expect(saved.mixins?.provenance).toEqual({
      entries: [legacy, accepted(entry('gen-1', 5))],
    })
  })

  it('does not restore stripped mixins on create', () => {
    const saved: ProvenanceCarrier = productProvenanceForSave(
      { name: 'Child' },
      { mixins: { color: { value: 'red' } }, metadata: { version: 3 } },
      [envelope('gen-1')],
      'create'
    )

    expect(saved.mixins?.color).toBeUndefined()
    expect(saved.mixins?.provenance).toEqual({
      entries: [accepted(entry('gen-1', 1))],
    })
  })
})

describe('pendingProvenanceAfterDiscard', () => {
  it('drops applied generations', () => {
    expect(pendingProvenanceAfterDiscard()).toEqual([])
  })
})

describe('pendingProvenanceForProduct', () => {
  it('keeps pending provenance for the same product and clears it when the product id changes', () => {
    const pending = [envelope('gen-1')]

    expect(pendingProvenanceForProduct(pending, 'product-a', 'product-a')).toBe(
      pending
    )
    expect(
      pendingProvenanceForProduct(pending, 'product-a', 'product-b')
    ).toEqual([])
    expect(pendingProvenanceForProduct(pending, undefined, 'product-a')).toBe(
      pending
    )
  })
})

describe('productFormKeepsDirtyValues', () => {
  it('keeps an applied description across a same-product refresh and the first load', () => {
    expect(productFormKeepsDirtyValues('product-a', 'product-a', false)).toBe(
      true
    )
    expect(productFormKeepsDirtyValues(undefined, 'product-a', false)).toBe(
      true
    )
  })

  it('drops applied edits when the product changes or the reset is explicit', () => {
    expect(productFormKeepsDirtyValues('product-a', 'product-b', false)).toBe(
      false
    )
    expect(productFormKeepsDirtyValues('product-a', 'product-a', true)).toBe(
      false
    )
  })
})

describe('withAiGeneratedFields', () => {
  it('stamps the language the description generation wrote', () => {
    const generated = envelope('gen-en')

    expect(withAiGeneratedFields(generated, ['description.en'])).toEqual({
      ...generated,
      mixins: {
        provenance: [
          { ...entry('gen-en'), aiGeneratedFields: ['description.en'] },
        ],
      },
    })
    expect(withAiGeneratedFields(generated, [' '])).toBe(generated)
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
