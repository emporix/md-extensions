import {
  CUSTOMER_ENTITY_TYPE,
  LEGAL_ENTITY_ENTITY_TYPE,
  RagCustomDatabase,
  RagEmporixEmbeddingConfig,
  RagEmporixFieldConfig,
  RagEntityType,
  RagLlmProvider,
  Tool,
  ToolConfig,
} from '../types/Tool'
import {
  areRagEmporixFilterFieldsValid,
  isValidRagFieldKey,
} from './ragEmporixToolHelpers'
import { DEFAULT_TEAMS_ALLOWED_OPERATIONS } from './teamsRoutingHelpers'
import { DEFAULT_SLACK_ALLOWED_OPERATIONS } from './slackRoutingHelpers'

export const MIXINS_PREFIX = 'mixins.'

export const isValidCustomFieldKey = (key?: string): boolean =>
  !!key?.startsWith(MIXINS_PREFIX) && key.length > MIXINS_PREFIX.length

export const normalizeEntityType = (
  value?: RagEntityType | string
): RagEntityType | undefined => {
  if (!value) return undefined

  if (value === RagEntityType.PRODUCT || value === 'PRODUCT') {
    return RagEntityType.PRODUCT
  }

  if (value === RagEntityType.ORDER || value === 'ORDER') {
    return RagEntityType.ORDER
  }

  if (value === RagEntityType.CUSTOMER || value === 'CUSTOMER') {
    return RagEntityType.CUSTOMER
  }

  if (
    value === RagEntityType.LEGAL_ENTITY ||
    value === 'LEGAL-ENTITY' ||
    value === 'LEGAL_ENTITY' ||
    value === 'legal_entity'
  ) {
    return RagEntityType.LEGAL_ENTITY
  }

  if (value === RagEntityType.INVALID || value === 'INVALID') {
    return RagEntityType.INVALID
  }

  return value as RagEntityType
}

export const mergeRagEmporixConfigOnLoad = (tool: Tool): ToolConfig => {
  const loadedConfig: ToolConfig = { ...tool.config }

  if (tool.type !== 'rag_emporix' || !tool.config.emporixNativeToolConfig) {
    return loadedConfig
  }

  const emporixConfig = tool.config.emporixNativeToolConfig
  const topLevelEmbedding =
    (loadedConfig.embeddingConfig as RagEmporixEmbeddingConfig | undefined) ||
    undefined
  const nestedEmbedding =
    (emporixConfig.embeddingConfig as RagEmporixEmbeddingConfig | undefined) ||
    undefined

  const mergedEmbeddingConfig: RagEmporixEmbeddingConfig | undefined =
    topLevelEmbedding || nestedEmbedding
      ? {
          ...(topLevelEmbedding || {}),
          ...(nestedEmbedding || {}),
        }
      : undefined

  const mergedEntityType = normalizeEntityType(
    emporixConfig.entityType ?? loadedConfig.entityType
  )

  return {
    ...loadedConfig,
    prompt: emporixConfig.prompt ?? loadedConfig.prompt,
    entityType: mergedEntityType,
    indexedFields: emporixConfig.indexedFields ?? loadedConfig.indexedFields,
    filterFields: emporixConfig.filterFields ?? loadedConfig.filterFields,
    embeddingConfig: mergedEmbeddingConfig,
  }
}

export const validateModelAndDimensions = (
  embeddingConfig: RagEmporixEmbeddingConfig
): boolean => {
  const dimensions = embeddingConfig.dimensions ?? 0
  return (
    !!embeddingConfig.model?.trim() && dimensions >= 128 && dimensions <= 4096
  )
}

interface IsToolFormValidParams {
  toolName: string
  toolId: string
  toolType: string
  config: ToolConfig
  isCreating: boolean
}

export const isToolFormValid = ({
  toolName,
  toolId,
  toolType,
  config,
  isCreating,
}: IsToolFormValidParams): boolean => {
  if (!toolName.trim() || (isCreating && !toolId.trim()) || !toolType.trim()) {
    return false
  }

  switch (toolType) {
    case 'slack':
      return (
        !!config.teamId?.trim() &&
        (!isCreating || !!config.botToken?.trim()) &&
        (config.allowedOperations?.length ??
          DEFAULT_SLACK_ALLOWED_OPERATIONS.length) > 0
      )

    case 'teams':
      return (
        !!config.teamId?.trim() &&
        !!config.tenantId?.trim() &&
        (config.allowedOperations?.length ??
          DEFAULT_TEAMS_ALLOWED_OPERATIONS.length) > 0
      )

    case 'rag_custom': {
      const databaseConfig = config.databaseConfig || {}
      const embeddingConfig = config.embeddingConfig || {}
      const maxResults = config.maxResults ?? 5
      return (
        !!config.prompt?.trim() &&
        maxResults >= 1 &&
        maxResults <= 100 &&
        !!databaseConfig.url?.trim() &&
        !!databaseConfig.collectionName?.trim() &&
        !!databaseConfig.token?.id &&
        !!embeddingConfig.model?.trim() &&
        !!embeddingConfig.token?.id
      )
    }

    case 'rag_emporix': {
      const indexedFields = config.indexedFields || []
      const filterFields = config.filterFields ?? []
      const embeddingConfig = (config.embeddingConfig ||
        {}) as RagEmporixEmbeddingConfig

      if (!config.prompt?.trim() || indexedFields.length === 0) {
        return false
      }

      const hasValidIndexedFields = indexedFields.every(
        (field: RagEmporixFieldConfig) => {
          if (!isValidRagFieldKey(field.key)) return false
          if (field.custom || field.key?.startsWith(MIXINS_PREFIX)) {
            return isValidCustomFieldKey(field.key)
          }
          return true
        }
      )

      if (
        !hasValidIndexedFields ||
        !areRagEmporixFilterFieldsValid(filterFields) ||
        !embeddingConfig.provider
      ) {
        return false
      }

      if (embeddingConfig.provider === RagLlmProvider.EMPORIX_OPENAI) {
        return true
      }

      if (embeddingConfig.provider === RagLlmProvider.OPENAI) {
        return (
          validateModelAndDimensions(embeddingConfig) &&
          !!embeddingConfig.token?.id
        )
      }

      if (embeddingConfig.provider === RagLlmProvider.SELF_HOSTED_OLLAMA) {
        return (
          validateModelAndDimensions(embeddingConfig) &&
          !!embeddingConfig.url?.trim() &&
          !!embeddingConfig.token?.id
        )
      }

      return false
    }

    case 'search': {
      const maxResults = Number(config.maxResults ?? 5)
      return (
        (config.entityType === CUSTOMER_ENTITY_TYPE ||
          config.entityType === LEGAL_ENTITY_ENTITY_TYPE) &&
        Number.isInteger(maxResults) &&
        maxResults >= 1 &&
        maxResults <= 10
      )
    }

    default:
      return true
  }
}

export const resolveSearchEntityType = (value?: string): string => {
  const normalized = value?.trim().toUpperCase().replace(/_/g, '-')
  if (normalized === 'LEGAL-ENTITY') {
    return LEGAL_ENTITY_ENTITY_TYPE
  }
  return CUSTOMER_ENTITY_TYPE
}

export const applySearchToolDefaults = (config: ToolConfig): ToolConfig => {
  const entityType = resolveSearchEntityType(config.entityType)
  const maxResults = Number(config.maxResults)
  const normalizedMaxResults =
    Number.isInteger(maxResults) && maxResults >= 1 && maxResults <= 10
      ? maxResults
      : 5

  return {
    ...config,
    entityType,
    maxResults: normalizedMaxResults,
  }
}

export const toSearchToolConfig = (config: ToolConfig): ToolConfig => {
  const withDefaults = applySearchToolDefaults(config)
  const prompt = config.prompt?.trim()

  return {
    entityType: withDefaults.entityType,
    maxResults: withDefaults.maxResults,
    ...(prompt ? { prompt } : {}),
  }
}

export const applyRagEmporixDefaults = (config: ToolConfig): ToolConfig => {
  const embeddingConfig =
    (config.embeddingConfig as RagEmporixEmbeddingConfig) || {}
  const needsUpdate = !config.entityType || !embeddingConfig.provider

  if (!needsUpdate) {
    return config
  }

  return {
    ...config,
    entityType: normalizeEntityType(config.entityType) || RagEntityType.PRODUCT,
    embeddingConfig: {
      ...embeddingConfig,
      provider: embeddingConfig.provider || RagLlmProvider.EMPORIX_OPENAI,
    },
  }
}

export const applyRagCustomDefaults = (config: ToolConfig): ToolConfig => {
  const databaseConfig = config.databaseConfig || {}
  const normalizedEntityType = normalizeEntityType(databaseConfig.entityType)
  const needsUpdate = !databaseConfig.type || !normalizedEntityType

  if (!needsUpdate) {
    return config
  }

  return {
    ...config,
    databaseConfig: {
      ...databaseConfig,
      type: databaseConfig.type || RagCustomDatabase.QDRANT,
      entityType: normalizedEntityType || RagEntityType.PRODUCT,
    },
  }
}
