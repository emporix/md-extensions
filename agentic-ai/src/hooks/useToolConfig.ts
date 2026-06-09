import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PRODUCT_ENTITY_TYPE,
  RagEmporixEmbeddingConfig,
  RagEmporixFieldConfig,
  RagEmporixFilterFieldConfig,
  Tool,
  ToolConfig,
} from '../types/Tool'
import { CustomSchemaType } from '../types/Schema'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import {
  getTokens,
  updateTool as updateToolApi,
} from '../services/toolsService'
import {
  getRagFilterMetadata,
  getRagMetadata,
  RagFilterMetadataField,
} from '../services/aiRagIndexerService'
import {
  buildRagEmporixEntityTypeOptions,
  getCustomSchemaTypes,
} from '../services/schemaService'
import { formatApiError } from '../utils/errorHelpers'
import { sanitizeIdInput } from '../utils/validation'
import {
  createEmptyFilterField,
  resolveRagEntityType,
  toRagEmporixToolConfig,
} from '../utils/ragEmporixToolHelpers'
import {
  MIXINS_PREFIX,
  applyRagCustomDefaults,
  applyRagEmporixDefaults,
  isToolFormValid,
  mergeRagEmporixConfigOnLoad,
} from '../utils/toolConfigHelpers'

interface UseToolConfigProps {
  tool: Tool | null
  isCreating: boolean
  onSave: () => void
}

interface ToolConfigState {
  toolId: string
  toolName: string
  toolType: string
  config: ToolConfig
}

export type ToolConfigField = 'toolId' | 'toolName' | 'toolType'

export const useToolConfig = ({
  tool,
  isCreating,
  onSave,
}: UseToolConfigProps) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [state, setState] = useState<ToolConfigState>({
    toolId: '',
    toolName: '',
    toolType: '',
    config: {},
  })
  const [saving, setSaving] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [availableFilterFields, setAvailableFilterFields] = useState<
    RagFilterMetadataField[]
  >([])
  const [customSchemaTypes, setCustomSchemaTypes] = useState<
    CustomSchemaType[]
  >([])
  const [customSchemaTypesLoading, setCustomSchemaTypesLoading] =
    useState(false)

  useEffect(() => {
    if (tool) {
      setState({
        toolId: tool.id ?? '',
        toolName: tool.name ?? '',
        toolType: tool.type ?? '',
        config: mergeRagEmporixConfigOnLoad(tool),
      })
    }
  }, [tool])

  const loadAvailableTokens = useCallback(async () => {
    try {
      const tokens = await getTokens(appState)
      setAvailableTokens(tokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      showError(t('error_loading_tokens'))
    }
  }, [appState, showError, t])

  const loadRagMetadata = useCallback(async () => {
    const entityType = resolveRagEntityType(state.config.entityType)

    try {
      const [fieldsResult, filterFieldsResult] = await Promise.allSettled([
        getRagMetadata(appState, entityType),
        getRagFilterMetadata(appState, entityType),
      ])

      if (fieldsResult.status === 'fulfilled') {
        setAvailableFields(fieldsResult.value)
      } else {
        console.error('Failed to load fields:', fieldsResult.reason)
        showError(t('error_loading_fields'))
      }

      if (filterFieldsResult.status === 'fulfilled') {
        setAvailableFilterFields(filterFieldsResult.value)
      } else {
        console.error(
          'Failed to load filter fields:',
          filterFieldsResult.reason
        )
        showError(t('error_loading_filter_fields'))
      }
    } catch (error) {
      console.error('Failed to load RAG metadata:', error)
    }
  }, [appState, showError, state.config.entityType, t])

  const loadCustomSchemaTypes = useCallback(async () => {
    if (!appState?.tenant || !appState?.token) {
      return
    }

    setCustomSchemaTypesLoading(true)
    try {
      const types = await getCustomSchemaTypes(appState)
      setCustomSchemaTypes(types)
    } catch (error) {
      console.error('Failed to load custom schema types:', error)
      setCustomSchemaTypes([])
      showError(t('error_loading_entity_types'))
    } finally {
      setCustomSchemaTypesLoading(false)
    }
  }, [appState, showError, t])

  const ragEmporixEntityTypeOptions = useMemo(() => {
    const options = buildRagEmporixEntityTypeOptions(
      customSchemaTypes,
      t('product'),
      appState.contentLanguage
    )
    const currentValue = resolveRagEntityType(state.config.entityType)

    if (
      currentValue !== PRODUCT_ENTITY_TYPE &&
      !options.some((option) => option.value === currentValue)
    ) {
      return [...options, { label: currentValue, value: currentValue }]
    }

    return options
  }, [appState.contentLanguage, customSchemaTypes, state.config.entityType, t])

  useEffect(() => {
    if (
      (state.toolType === 'rag_custom' || state.toolType === 'rag_emporix') &&
      appState
    ) {
      loadAvailableTokens()
    }
  }, [state.toolType, appState, loadAvailableTokens])

  useEffect(() => {
    if (state.toolType === 'rag_emporix' && appState) {
      void loadCustomSchemaTypes()
    } else {
      setCustomSchemaTypes([])
    }
  }, [state.toolType, appState, loadCustomSchemaTypes])

  useEffect(() => {
    if (state.toolType === 'rag_emporix' && appState) {
      void loadRagMetadata()
    }
  }, [state.toolType, appState, loadRagMetadata])

  useEffect(() => {
    if (state.toolType === 'rag_emporix') {
      setState((prev) => {
        const nextConfig = applyRagEmporixDefaults(prev.config)
        if (nextConfig === prev.config) {
          return prev
        }
        return { ...prev, config: nextConfig }
      })
    }
  }, [state.toolType, state.config.entityType, state.config.embeddingConfig])

  useEffect(() => {
    if (state.toolType === 'rag_custom') {
      setState((prev) => {
        const nextConfig = applyRagCustomDefaults(prev.config)
        if (nextConfig === prev.config) {
          return prev
        }
        return { ...prev, config: nextConfig }
      })
    }
  }, [state.toolType, state.config.databaseConfig])

  const updateField = useCallback((field: ToolConfigField, value: string) => {
    setState((prev) => {
      if (field === 'toolType') {
        return {
          ...prev,
          toolType: value,
          config: {},
        }
      }

      return {
        ...prev,
        [field]: field === 'toolId' ? sanitizeIdInput(value) : value,
      }
    })
  }, [])

  const updateConfig = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }))
  }, [])

  const updateRagEmporixEntityType = useCallback((entityType: string) => {
    setState((prev) => {
      const currentEntityType = resolveRagEntityType(prev.config.entityType)
      const nextEntityType = resolveRagEntityType(entityType)

      if (currentEntityType === nextEntityType) {
        return prev
      }

      return {
        ...prev,
        config: {
          ...prev.config,
          entityType: nextEntityType,
          indexedFields: [],
          filterFields: [],
        },
      }
    })
  }, [])

  const updateNestedConfig = useCallback(
    (parentKey: string, childKey: string, value: string) => {
      setState((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          [parentKey]: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((prev.config as any)[parentKey] || {}),
            [childKey]: value,
          },
        },
      }))
    },
    []
  )

  const updateDeeplyNestedConfig = useCallback(
    (
      parentKey: string,
      childKey: string,
      grandchildKey: string,
      value: string
    ) => {
      setState((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          [parentKey]: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((prev.config as any)[parentKey] || {}),
            [childKey]: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...((prev.config as any)[parentKey]?.[childKey] || {}),
              [grandchildKey]: value,
            },
          },
        },
      }))
    },
    []
  )

  const updateEmbeddingDimensions = useCallback((value: number | null) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        embeddingConfig: {
          ...(prev.config.embeddingConfig as RagEmporixEmbeddingConfig),
          dimensions: value,
        },
      },
    }))
  }, [])

  const addIndexedField = useCallback(() => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        indexedFields: [
          ...(prev.config.indexedFields || []),
          { name: '', key: '' },
        ],
      },
    }))
  }, [])

  const addCustomIndexedField = useCallback(() => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        indexedFields: [
          ...(prev.config.indexedFields || []),
          { name: '', key: MIXINS_PREFIX, custom: true },
        ],
      },
    }))
  }, [])

  const removeIndexedField = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        indexedFields: (prev.config.indexedFields || []).filter(
          (_, i) => i !== index
        ),
      },
    }))
  }, [])

  const updateIndexedField = useCallback(
    (index: number, field: keyof RagEmporixFieldConfig, value: string) => {
      setState((prev) => {
        const indexedFields = [...(prev.config.indexedFields || [])]
        indexedFields[index] = { ...indexedFields[index], [field]: value }
        return {
          ...prev,
          config: {
            ...prev.config,
            indexedFields,
          },
        }
      })
    },
    []
  )

  const addFilterField = useCallback(() => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        filterFields: [
          ...(prev.config.filterFields ?? []),
          createEmptyFilterField(),
        ],
      },
    }))
  }, [])

  const removeFilterField = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        filterFields: (prev.config.filterFields ?? []).filter(
          (_, i) => i !== index
        ),
      },
    }))
  }, [])

  const updateFilterField = useCallback(
    (
      index: number,
      field: keyof Pick<RagEmporixFilterFieldConfig, 'description'>,
      value: string
    ) => {
      setState((prev) => {
        const filterFields = [...(prev.config.filterFields ?? [])]
        filterFields[index] = { ...filterFields[index], [field]: value }
        return {
          ...prev,
          config: {
            ...prev.config,
            filterFields,
          },
        }
      })
    },
    []
  )

  const selectFilterFieldKey = useCallback(
    (index: number, key?: string | null) => {
      setState((prev) => {
        const filterFields = [...(prev.config.filterFields ?? [])]

        if (!key?.trim()) {
          filterFields[index] = createEmptyFilterField()
        } else {
          filterFields[index] = { key }
        }

        return {
          ...prev,
          config: {
            ...prev.config,
            filterFields,
          },
        }
      })
    },
    []
  )

  const isFormValid = isToolFormValid({
    toolName: state.toolName,
    toolId: state.toolId,
    toolType: state.toolType,
    config: state.config,
    isCreating,
  })

  const handleSave = useCallback(async () => {
    if (!tool || !isFormValid) {
      return
    }

    const updatedTool: Tool = {
      ...tool,
      id: state.toolId,
      name: state.toolName,
      type: state.toolType,
      config:
        state.toolType === 'rag_emporix'
          ? toRagEmporixToolConfig(state.config)
          : state.config,
      enabled: tool.enabled ?? true,
    }

    try {
      setSaving(true)
      await updateToolApi(appState, updatedTool)
      showSuccess(
        isCreating
          ? t('tool_created_successfully')
          : t('tool_updated_successfully')
      )
      onSave()
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_saving_tool'))
      showError(`${t('error_saving_tool')}: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }, [
    appState,
    isCreating,
    isFormValid,
    onSave,
    showError,
    showSuccess,
    state.config,
    state.toolId,
    state.toolName,
    state.toolType,
    t,
    tool,
  ])

  return {
    state,
    saving,
    availableTokens,
    availableFields,
    availableFilterFields,
    customSchemaTypesLoading,
    ragEmporixEntityTypeOptions,
    updateField,
    updateConfig,
    updateRagEmporixEntityType,
    updateNestedConfig,
    updateDeeplyNestedConfig,
    updateEmbeddingDimensions,
    addIndexedField,
    addCustomIndexedField,
    removeIndexedField,
    updateIndexedField,
    addFilterField,
    removeFilterField,
    updateFilterField,
    selectFilterFieldKey,
    handleSave,
    isFormValid,
  }
}
