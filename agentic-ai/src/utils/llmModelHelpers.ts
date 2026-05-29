import { LlmProvider } from '../types/Agent'
import {
  LlmModel,
  LlmModelProvider,
  ProviderModelsResponse,
} from '../types/Model'

export type ModelsByProviderMap = Map<LlmModelProvider, LlmModel[]>

const LLM_MODEL_PROVIDERS: LlmModelProvider[] = [
  'openai',
  'anthropic',
  'google',
]

export const normalizeLlmModelProvider = (
  provider: string
): LlmModelProvider | null => {
  const normalized = provider.trim().toLowerCase()
  return LLM_MODEL_PROVIDERS.find((item) => item === normalized) ?? null
}

export const toModelsByProvider = (
  responses: ProviderModelsResponse[]
): ModelsByProviderMap => {
  const map: ModelsByProviderMap = new Map()

  responses.forEach((entry) => {
    const provider = normalizeLlmModelProvider(entry.provider)
    if (!provider || !Array.isArray(entry.models)) {
      return
    }

    map.set(provider, entry.models)
  })

  return map
}

export const isEmptyModelsCatalog = (catalog: ModelsByProviderMap): boolean => {
  if (catalog.size === 0) {
    return true
  }

  for (const models of catalog.values()) {
    if (models.length > 0) {
      return false
    }
  }

  return true
}

export type ModelDropdownOption = {
  label: string
  value: string
  description?: string
  thinking?: boolean
}

export const getModelsApiProvider = (
  provider: LlmProvider
): LlmModelProvider | null => {
  switch (provider) {
    case LlmProvider.OPENAI:
    case LlmProvider.EMPORIX_OPENAI:
      return 'openai'
    case LlmProvider.ANTHROPIC:
      return 'anthropic'
    case LlmProvider.GOOGLE:
      return 'google'
    default:
      return null
  }
}

export const usesModelCatalog = (provider: LlmProvider): boolean =>
  getModelsApiProvider(provider) !== null

export const isSelfHostedProvider = (provider: LlmProvider): boolean =>
  provider === LlmProvider.SELF_HOSTED_OLLAMA ||
  provider === LlmProvider.SELF_HOSTED_VLLM

export const sortCatalogModels = (models: LlmModel[]): LlmModel[] =>
  [...models].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
  )

export const getModelsForProvider = (
  provider: LlmProvider,
  modelsByProvider: Map<LlmModelProvider, LlmModel[]>
): LlmModel[] => {
  const apiProvider = getModelsApiProvider(provider)
  if (!apiProvider) {
    return []
  }
  return sortCatalogModels(modelsByProvider.get(apiProvider) ?? [])
}

export const findCatalogModel = (
  models: LlmModel[],
  modelValue: string
): LlmModel | undefined => {
  const trimmed = modelValue.trim()
  if (!trimmed) {
    return undefined
  }

  return (
    models.find((item) => item.id === trimmed) ??
    models.find((item) => item.name === trimmed)
  )
}

export const resolveCatalogModelId = (
  models: LlmModel[],
  modelValue: string
): string | null => {
  const match = findCatalogModel(models, modelValue)
  return match?.id ?? null
}

export const buildModelDropdownOptions = (
  models: LlmModel[]
): ModelDropdownOption[] =>
  models.map((model) => ({
    label: model.name,
    value: model.id,
    description: model.description,
    thinking: model.thinking,
  }))

export const resolveModelAfterProviderChange = (
  provider: LlmProvider,
  currentModel: string,
  modelsByProvider: Map<LlmModelProvider, LlmModel[]>
): string => {
  return resolveModelForProviderSwitch(
    provider,
    modelsByProvider,
    currentModel.trim() ? currentModel : undefined
  )
}

export type ProviderModelMemory = Partial<Record<LlmProvider, string>>

export const rememberModelForProvider = (
  memory: ProviderModelMemory,
  provider: LlmProvider,
  modelValue: string,
  catalogModels: LlmModel[] = []
): void => {
  const trimmed = modelValue.trim()
  if (!trimmed) {
    return
  }

  if (isSelfHostedProvider(provider)) {
    memory[provider] = trimmed
    return
  }

  const match = findCatalogModel(catalogModels, trimmed)
  memory[provider] = match?.id ?? trimmed
}

export const resolveModelForProviderSwitch = (
  provider: LlmProvider,
  modelsByProvider: Map<LlmModelProvider, LlmModel[]>,
  rememberedModel?: string
): string => {
  if (isSelfHostedProvider(provider)) {
    return rememberedModel?.trim() ?? ''
  }

  if (!usesModelCatalog(provider)) {
    return rememberedModel?.trim() ?? ''
  }

  const models = getModelsForProvider(provider, modelsByProvider)
  if (models.length === 0) {
    return rememberedModel?.trim() ?? ''
  }

  if (rememberedModel?.trim()) {
    const match = findCatalogModel(models, rememberedModel)
    if (match) {
      return match.id
    }
  }

  return models[0].id
}
