import {
  PRODUCT_ENTITY_TYPE,
  RAG_FIELD_KEY_PATTERN,
  RagEmporixEmbeddingConfig,
  RagEmporixFieldConfig,
  RagEmporixFilterFieldConfig,
  ToolConfig,
} from '../types/Tool'

export const resolveRagEntityType = (entityType?: string): string => {
  const trimmed = entityType?.trim()
  return trimmed || PRODUCT_ENTITY_TYPE
}

export const isValidRagFieldKey = (key?: string): key is string => {
  const trimmed = key?.trim()
  return !!trimmed && RAG_FIELD_KEY_PATTERN.test(trimmed)
}

export const sanitizeRagEmporixIndexedFields = (
  fields: RagEmporixFieldConfig[]
): RagEmporixFieldConfig[] =>
  fields.flatMap((field) => {
    if (!isValidRagFieldKey(field.key)) {
      return []
    }

    const key = field.key.trim()
    return [
      {
        key,
        ...(field.name?.trim() ? { name: field.name.trim() } : {}),
      },
    ]
  })

export const sanitizeRagEmporixFilterFields = (
  fields: RagEmporixFilterFieldConfig[]
): RagEmporixFilterFieldConfig[] =>
  fields.flatMap((field) => {
    if (!isValidRagFieldKey(field.key)) {
      return []
    }

    const key = field.key.trim()
    return [
      {
        key,
        ...(field.name?.trim() ? { name: field.name.trim() } : {}),
        ...(field.description?.trim()
          ? { description: field.description.trim() }
          : {}),
      },
    ]
  })

export const toRagEmporixToolConfig = (config: ToolConfig): ToolConfig => ({
  prompt: config.prompt,
  entityType: resolveRagEntityType(config.entityType),
  indexedFields: sanitizeRagEmporixIndexedFields(config.indexedFields ?? []),
  filterFields: sanitizeRagEmporixFilterFields(config.filterFields ?? []),
  embeddingConfig: config.embeddingConfig as
    | RagEmporixEmbeddingConfig
    | undefined,
})

export const areRagEmporixFilterFieldsValid = (
  fields: RagEmporixFilterFieldConfig[]
): boolean => fields.every((field) => isValidRagFieldKey(field.key))

export const getRagFilterFieldLabel = (field: {
  key: string
  name?: string
}): string => (field.name?.trim() ? `${field.key} (${field.name})` : field.key)

export const getRagFilterFieldDisplayLabel = (
  field: RagEmporixFilterFieldConfig,
  availableFilterFields: Array<{ key: string; name?: string }>
): string | undefined => {
  const key = field.key?.trim()
  if (!key) {
    return undefined
  }

  const metadata = availableFilterFields.find(
    (availableField) => availableField.key === key
  )

  return getRagFilterFieldLabel(metadata ?? { key, name: field.name })
}

export const getAvailableFilterFieldsForIndex = (
  allFields: Array<{ key: string; name?: string; description?: string }>,
  selectedFields: RagEmporixFilterFieldConfig[],
  currentIndex: number
): Array<{ key: string; name?: string; description?: string }> => {
  const selectedKeys = selectedFields
    .map((field, index) =>
      index !== currentIndex && field.key?.trim() ? field.key : null
    )
    .filter((key): key is string => !!key)

  const options = allFields.filter((field) => !selectedKeys.includes(field.key))

  const currentKey = selectedFields[currentIndex]?.key
  if (
    currentKey?.trim() &&
    !options.some((field) => field.key === currentKey)
  ) {
    const currentField = selectedFields[currentIndex]
    return [
      {
        key: currentKey,
        name: currentField?.name,
        description: currentField?.description,
      },
      ...options,
    ]
  }

  return options
}

export const createEmptyFilterField = (): RagEmporixFilterFieldConfig => ({
  key: '',
  name: '',
  description: '',
})

export const getAvailableIndexedFieldsForIndex = (
  allFields: string[],
  selectedFields: RagEmporixFieldConfig[],
  currentIndex: number
): string[] => {
  const selectedKeys = selectedFields
    .map((field, index) =>
      index !== currentIndex && field.key?.trim() ? field.key : null
    )
    .filter((key): key is string => !!key)

  return allFields.filter((field) => {
    return !selectedKeys.some((selectedKey) => {
      const isExactMatch = field === selectedKey
      const isParentOfSelected = selectedKey.startsWith(`${field}.`)
      const isChildOfSelected = field.startsWith(`${selectedKey}.`)
      return isExactMatch || isParentOfSelected || isChildOfSelected
    })
  })
}
