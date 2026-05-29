import { describe, expect, it } from 'vitest'
import { LlmProvider } from '../types/Agent'
import { LlmModel, LlmModelProvider } from '../types/Model'
import {
  buildModelDropdownOptions,
  findCatalogModel,
  getModelsApiProvider,
  getModelsForProvider,
  isEmptyModelsCatalog,
  isSelfHostedProvider,
  normalizeLlmModelProvider,
  rememberModelForProvider,
  resolveCatalogModelId,
  resolveModelAfterProviderChange,
  resolveModelForProviderSwitch,
  sortCatalogModels,
  toModelsByProvider,
  usesModelCatalog,
  type ProviderModelMemory,
} from './llmModelHelpers'

const modelsByProvider = new Map<LlmModelProvider, LlmModel[]>([
  [
    'openai',
    [
      { id: 'gpt-4.1-mini', name: 'gpt-4.1-mini' },
      { id: 'gpt-4.1', name: 'gpt-4.1' },
    ],
  ],
  [
    'anthropic',
    [{ id: 'claude-opus-4-6', name: 'Claude Opus 4.6', thinking: true }],
  ],
])

describe('llmModelHelpers', () => {
  it('getModelsApiProvider maps emporix_openai to openai', () => {
    expect(getModelsApiProvider(LlmProvider.EMPORIX_OPENAI)).toBe('openai')
    expect(getModelsApiProvider(LlmProvider.OPENAI)).toBe('openai')
    expect(getModelsApiProvider(LlmProvider.ANTHROPIC)).toBe('anthropic')
    expect(getModelsApiProvider(LlmProvider.GOOGLE)).toBe('google')
    expect(getModelsApiProvider(LlmProvider.SELF_HOSTED_OLLAMA)).toBeNull()
  })

  it('usesModelCatalog returns true only for catalog-backed providers', () => {
    expect(usesModelCatalog(LlmProvider.OPENAI)).toBe(true)
    expect(usesModelCatalog(LlmProvider.EMPORIX_OPENAI)).toBe(true)
    expect(usesModelCatalog(LlmProvider.SELF_HOSTED_VLLM)).toBe(false)
  })

  it('isSelfHostedProvider identifies self-hosted providers', () => {
    expect(isSelfHostedProvider(LlmProvider.SELF_HOSTED_OLLAMA)).toBe(true)
    expect(isSelfHostedProvider(LlmProvider.SELF_HOSTED_VLLM)).toBe(true)
    expect(isSelfHostedProvider(LlmProvider.OPENAI)).toBe(false)
  })

  it('getModelsForProvider returns models for mapped provider', () => {
    expect(
      getModelsForProvider(LlmProvider.EMPORIX_OPENAI, modelsByProvider)
    ).toHaveLength(2)
    expect(
      getModelsForProvider(LlmProvider.SELF_HOSTED_OLLAMA, modelsByProvider)
    ).toEqual([])
  })

  it('sortCatalogModels sorts models alphabetically by name', () => {
    expect(
      sortCatalogModels([
        { id: 'z-model', name: 'Zeta' },
        { id: 'a-model', name: 'Alpha' },
        { id: 'm-model', name: 'Middle' },
      ]).map((item) => item.name)
    ).toEqual(['Alpha', 'Middle', 'Zeta'])
  })

  it('getModelsForProvider returns models sorted alphabetically', () => {
    const sortedNames = getModelsForProvider(
      LlmProvider.OPENAI,
      modelsByProvider
    ).map((item) => item.name)

    expect(sortedNames).toEqual(
      [...sortedNames].sort((a, b) => a.localeCompare(b))
    )
  })

  it('buildModelDropdownOptions maps model metadata', () => {
    expect(
      buildModelDropdownOptions([
        {
          id: 'claude-opus-4-6',
          name: 'Claude Opus 4.6',
          description: 'Top tier',
          thinking: true,
        },
      ])
    ).toEqual([
      {
        label: 'Claude Opus 4.6',
        value: 'claude-opus-4-6',
        description: 'Top tier',
        thinking: true,
      },
    ])
  })

  it('resolveModelAfterProviderChange keeps valid model', () => {
    expect(
      resolveModelAfterProviderChange(
        LlmProvider.OPENAI,
        'gpt-4.1',
        modelsByProvider
      )
    ).toBe('gpt-4.1')
  })

  it('resolveModelAfterProviderChange defaults to first catalog model', () => {
    expect(
      resolveModelAfterProviderChange(
        LlmProvider.ANTHROPIC,
        'unknown-model',
        modelsByProvider
      )
    ).toBe('claude-opus-4-6')
  })

  it('findCatalogModel matches by id or name', () => {
    const models = modelsByProvider.get('anthropic') ?? []
    expect(findCatalogModel(models, 'claude-opus-4-6')?.id).toBe(
      'claude-opus-4-6'
    )
    expect(findCatalogModel(models, 'Claude Opus 4.6')?.id).toBe(
      'claude-opus-4-6'
    )
  })

  it('resolveCatalogModelId returns canonical id', () => {
    expect(
      resolveCatalogModelId(
        modelsByProvider.get('anthropic') ?? [],
        'Claude Opus 4.6'
      )
    ).toBe('claude-opus-4-6')
  })

  it('resolveModelAfterProviderChange keeps manual model for self-hosted', () => {
    expect(
      resolveModelAfterProviderChange(
        LlmProvider.SELF_HOSTED_OLLAMA,
        'llama3',
        modelsByProvider
      )
    ).toBe('llama3')
  })

  it('resolveModelForProviderSwitch restores remembered catalog model', () => {
    expect(
      resolveModelForProviderSwitch(
        LlmProvider.ANTHROPIC,
        modelsByProvider,
        'claude-opus-4-6'
      )
    ).toBe('claude-opus-4-6')
  })

  it('resolveModelForProviderSwitch defaults to first catalog model', () => {
    expect(
      resolveModelForProviderSwitch(LlmProvider.OPENAI, modelsByProvider)
    ).toBe('gpt-4.1')
  })

  it('rememberModelForProvider stores canonical model id per provider', () => {
    const memory: ProviderModelMemory = {}

    rememberModelForProvider(
      memory,
      LlmProvider.ANTHROPIC,
      'Claude Opus 4.6',
      modelsByProvider.get('anthropic') ?? []
    )

    expect(memory[LlmProvider.ANTHROPIC]).toBe('claude-opus-4-6')
  })

  it('normalizeLlmModelProvider accepts lowercase provider keys', () => {
    expect(normalizeLlmModelProvider('OPENAI')).toBe('openai')
    expect(normalizeLlmModelProvider(' Anthropic ')).toBe('anthropic')
    expect(normalizeLlmModelProvider('unknown')).toBeNull()
  })

  it('toModelsByProvider normalizes provider keys from API payload', () => {
    const catalog = toModelsByProvider([
      {
        provider: 'OPENAI' as never,
        models: [{ id: 'gpt-4.1', name: 'gpt-4.1' }],
      },
      {
        provider: 'anthropic',
        models: [{ id: 'claude-opus-4-6', name: 'Claude Opus 4.6' }],
      },
    ])

    expect(catalog.get('openai')).toHaveLength(1)
    expect(catalog.get('anthropic')).toHaveLength(1)
    expect(isEmptyModelsCatalog(catalog)).toBe(false)
  })

  it('isEmptyModelsCatalog detects empty catalogs', () => {
    expect(isEmptyModelsCatalog(new Map())).toBe(true)
    expect(
      isEmptyModelsCatalog(
        new Map([
          ['openai', []],
          ['anthropic', []],
        ])
      )
    ).toBe(true)
    expect(isEmptyModelsCatalog(modelsByProvider)).toBe(false)
  })
})
