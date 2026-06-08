import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Tooltip } from 'primereact/tooltip'
import { LlmProvider } from '../../../types/Agent'
import { LlmModel, LlmModelProvider } from '../../../types/Model'
import { Token } from '../../../types/Token'
import { getLlmProviders } from '../../../utils/constants'
import { ModelListItem } from './ModelListItem'
import {
  findCatalogModel,
  getModelsForProvider,
  isSelfHostedProvider,
  rememberModelForProvider,
  resolveCatalogModelId,
  resolveModelForProviderSwitch,
  usesModelCatalog,
  type ProviderModelMemory,
} from '../../../utils/llmModelHelpers'

type ModelInputMode = 'list' | 'custom'

interface ModelSectionProps {
  provider: LlmProvider
  model: string
  temperature: string
  maxTokens: string
  tokenId: string
  recursionLimit: string
  enableMemory: boolean
  selfHostedUrl: string
  selfHostedAuthHeaderName: string
  selfHostedTokenId: string
  modelsByProvider: Map<LlmModelProvider, LlmModel[]>
  modelsLoading: boolean
  modelsFetched: boolean
  modelsError: string | null
  tokens: Token[]
  tokensLoading: boolean
  isCreateMode?: boolean
  onFieldChange: (field: string, value: string | boolean) => void
}

export const ModelSection: React.FC<ModelSectionProps> = ({
  provider,
  model,
  temperature,
  maxTokens,
  tokenId,
  recursionLimit,
  enableMemory,
  selfHostedUrl,
  selfHostedAuthHeaderName,
  selfHostedTokenId,
  modelsByProvider,
  modelsLoading,
  modelsFetched,
  modelsError,
  tokens,
  tokensLoading,
  isCreateMode = false,
  onFieldChange,
}) => {
  const { t } = useTranslation()
  const llmProviderOptions = useMemo(() => getLlmProviders(t), [t])
  const [modelInputMode, setModelInputMode] = useState<ModelInputMode>('list')
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const modelRef = useRef(model)
  const onFieldChangeRef = useRef(onFieldChange)
  const listingsContainerRef = useRef<HTMLDivElement>(null)
  const providerModelMemoryRef = useRef<ProviderModelMemory>({})

  modelRef.current = model
  onFieldChangeRef.current = onFieldChange

  const isSelfHosted = isSelfHostedProvider(provider)
  const showCatalogModel = usesModelCatalog(provider)
  const showTokenField =
    provider !== LlmProvider.EMPORIX_OPENAI && !isSelfHosted

  const catalogModels = useMemo(
    () =>
      showCatalogModel ? getModelsForProvider(provider, modelsByProvider) : [],
    [modelsByProvider, provider, showCatalogModel]
  )

  const filteredCatalogModels = useMemo(() => {
    const query = modelSearchQuery.trim().toLowerCase()
    if (!query) {
      return catalogModels
    }

    return catalogModels.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query)
      const descriptionMatch =
        item.description?.toLowerCase().includes(query) ?? false
      return nameMatch || descriptionMatch
    })
  }, [catalogModels, modelSearchQuery])

  const isCustomMode = isSelfHosted || modelInputMode === 'custom'
  const isCatalogPending = modelsLoading || !modelsFetched
  const isModelMissing = !model.trim()

  useEffect(() => {
    rememberModelForProvider(
      providerModelMemoryRef.current,
      provider,
      model,
      catalogModels
    )
  }, [provider, model, catalogModels])

  useEffect(() => {
    setModelSearchQuery('')
  }, [provider])

  useEffect(() => {
    if (isSelfHosted) {
      setModelInputMode('custom')
      return
    }

    if (!showCatalogModel) {
      setModelInputMode('custom')
      return
    }

    if (modelsLoading || !modelsFetched) {
      setModelInputMode('list')
      return
    }

    const currentModel = modelRef.current
    const matchedModel = findCatalogModel(catalogModels, currentModel)

    if (currentModel.trim() && !matchedModel) {
      setModelInputMode('custom')
      return
    }

    setModelInputMode('list')

    if (matchedModel && matchedModel.id !== currentModel) {
      onFieldChangeRef.current('model', matchedModel.id)
    }
  }, [
    provider,
    isSelfHosted,
    showCatalogModel,
    catalogModels,
    modelsLoading,
    modelsFetched,
  ])

  useEffect(() => {
    if (
      isCustomMode ||
      modelsLoading ||
      !modelsFetched ||
      catalogModels.length === 0
    ) {
      return
    }

    const selectedModelId = resolveCatalogModelId(catalogModels, model)
    if (!selectedModelId) {
      return
    }

    const container = listingsContainerRef.current
    if (!container) {
      return
    }

    const selectedElement = container.querySelector<HTMLElement>(
      `[data-model-id="${selectedModelId}"]`
    )
    if (!selectedElement) {
      return
    }

    requestAnimationFrame(() => {
      selectedElement.scrollIntoView({ block: 'nearest' })
    })
  }, [
    isCustomMode,
    modelsLoading,
    modelsFetched,
    catalogModels,
    model,
    provider,
  ])

  const tokenOptions = tokens
    .map((token) => ({
      label: token.name,
      value: token.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const handleProviderChange = (nextProvider: LlmProvider) => {
    rememberModelForProvider(
      providerModelMemoryRef.current,
      provider,
      model,
      catalogModels
    )

    onFieldChange('provider', nextProvider)

    const rememberedModel = providerModelMemoryRef.current[nextProvider]
    const nextModel = resolveModelForProviderSwitch(
      nextProvider,
      modelsByProvider,
      rememberedModel
    )

    if (nextModel !== model) {
      onFieldChange('model', nextModel)
    }
  }

  const handleModelInputModeChange = (mode: ModelInputMode) => {
    if (isSelfHosted || !showCatalogModel) {
      return
    }

    setModelInputMode(mode)

    if (mode === 'list') {
      const matchedId = resolveCatalogModelId(catalogModels, model)
      if (matchedId) {
        if (matchedId !== model) {
          onFieldChange('model', matchedId)
        }
        return
      }
      if (catalogModels.length > 0) {
        onFieldChange('model', catalogModels[0].id)
      }
    }
  }

  const renderModelListings = () => {
    const listingsPanelClassName = `agent-detail-model-listings-panel${
      isModelMissing ? ' agent-detail-model-listings-panel--invalid' : ''
    }`

    if (isCustomMode) {
      return (
        <div className={listingsPanelClassName}>
          <div className="agent-detail-model-listings-body agent-detail-model-listings-body--custom">
            <div
              className={`agent-detail-model-custom-card${
                isModelMissing ? ' agent-detail-model-custom-card--invalid' : ''
              }`}
            >
              <label className="field-label agent-detail-model-custom-label">
                {t('custom_model_name')}
                {isSelfHosted && (
                  <span className="agent-detail-required"> *</span>
                )}
                <i
                  className="pi pi-info-circle field-label-help-icon agent-detail-model-custom-help"
                  data-pr-tooltip={t('custom_model_name_tooltip')}
                  data-pr-position="top"
                />
              </label>
              <Tooltip target=".agent-detail-model-custom-help" />
              <InputText
                value={model}
                onChange={(event) => onFieldChange('model', event.target.value)}
                className={`w-full${!model.trim() ? ' p-invalid' : ''}`}
                placeholder={t('enter_model')}
              />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={listingsPanelClassName}>
        <div
          ref={listingsContainerRef}
          className="agent-detail-model-listings-body"
        >
          {isCatalogPending && (
            <p className="agent-detail-model-listings-empty">
              {t('loading_models')}
            </p>
          )}
          {!isCatalogPending && catalogModels.length === 0 && (
            <p className="agent-detail-model-listings-empty">
              {modelsError
                ? t('error_loading_models')
                : t('no_models_available')}
            </p>
          )}
          {!isCatalogPending &&
            catalogModels.length > 0 &&
            filteredCatalogModels.length === 0 && (
              <p className="agent-detail-model-listings-empty">
                {t('no_models_match_search')}
              </p>
            )}
          {!isCatalogPending &&
            filteredCatalogModels.map((item) => {
              const isSelected =
                model === item.id ||
                (model.trim() !== '' && model === item.name)
              return (
                <ModelListItem
                  key={item.id}
                  model={item}
                  isSelected={isSelected}
                  onSelect={(modelId) => onFieldChange('model', modelId)}
                />
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="agent-detail-tab-panel agent-detail-model-tab">
      <h2 className="agent-detail-section-title">{t('model')}</h2>

      {modelsError && showCatalogModel && !isCustomMode && (
        <Message
          severity="warn"
          text={t('error_loading_models')}
          className="agent-detail-model-error-message"
        />
      )}

      <section className="agent-detail-model-card">
        <div className="agent-detail-model-top-row">
          <div className="form-field">
            <label className="field-label">{t('select_provider')}</label>
            <Dropdown
              value={provider}
              options={llmProviderOptions}
              onChange={(event) => handleProviderChange(event.value)}
              className="w-full"
              appendTo="self"
            />
          </div>

          <div className="form-field agent-detail-model-token-field">
            {showTokenField ? (
              <>
                <label className="field-label">
                  {t('token')}
                  {isCreateMode && (
                    <span className="agent-detail-required"> *</span>
                  )}
                </label>
                <Dropdown
                  value={tokenId || null}
                  options={tokenOptions}
                  onChange={(event) =>
                    onFieldChange('tokenId', event.value ?? '')
                  }
                  className={`w-full${isCreateMode && !tokenId.trim() ? ' p-invalid' : ''}`}
                  placeholder={
                    tokensLoading ? t('loading_tokens') : t('select_token')
                  }
                  disabled={tokensLoading}
                  appendTo="self"
                />
              </>
            ) : (
              <div
                className="agent-detail-model-token-field-placeholder"
                aria-hidden="true"
              >
                <span className="field-label">&nbsp;</span>
                <div className="agent-detail-model-token-field-placeholder-control" />
              </div>
            )}
          </div>
        </div>

        <div className="agent-detail-model-divider" />

        <div className="agent-detail-model-listings-section">
          {showCatalogModel && !isSelfHosted && (
            <div className="agent-detail-model-provider-type">
              <span className="field-label">
                {t('provider_type')}
                <span className="agent-detail-required"> *</span>
              </span>
              <div className="agent-detail-model-mode-toolbar">
                <div
                  className="agent-detail-model-mode-toggle"
                  role="group"
                  aria-label={t('provider_type')}
                >
                  <button
                    type="button"
                    className={`agent-detail-model-mode-btn${modelInputMode === 'list' ? ' agent-detail-model-mode-btn--active' : ''}`}
                    onClick={() => handleModelInputModeChange('list')}
                  >
                    {t('model_input_mode_list')}
                  </button>
                  <button
                    type="button"
                    className={`agent-detail-model-mode-btn${modelInputMode === 'custom' ? ' agent-detail-model-mode-btn--active' : ''}`}
                    onClick={() => handleModelInputModeChange('custom')}
                  >
                    {t('model_input_mode_custom')}
                  </button>
                </div>

                <InputText
                  value={modelSearchQuery}
                  onChange={(event) => setModelSearchQuery(event.target.value)}
                  placeholder={t('search_for_models')}
                  className={`agent-detail-model-listings-search${isCustomMode ? ' agent-detail-model-listings-search--hidden' : ''}`}
                  aria-label={t('search_for_models')}
                  disabled={
                    isCustomMode ||
                    isCatalogPending ||
                    catalogModels.length === 0
                  }
                  tabIndex={isCustomMode ? -1 : undefined}
                  aria-hidden={isCustomMode}
                />
              </div>
            </div>
          )}

          {renderModelListings()}
        </div>

        <div className="agent-detail-model-divider" />

        <div className="agent-detail-model-bottom-section">
          <div className="agent-detail-model-memory-row">
            <div className="form-field agent-detail-model-max-tokens-field">
              <label className="field-label">{t('max_tokens')}</label>
              <InputText
                value={maxTokens}
                onChange={(event) =>
                  onFieldChange('maxTokens', event.target.value)
                }
                className="w-full"
              />
            </div>

            <div className="form-field agent-detail-model-memory-field">
              <span
                className="field-label agent-detail-model-memory-field-spacer"
                aria-hidden="true"
              >
                {t('max_tokens')}
              </span>
              <div className="agent-detail-model-memory-switch">
                <InputSwitch
                  inputId="agent-detail-enable-memory"
                  checked={enableMemory}
                  onChange={(event) =>
                    onFieldChange('enableMemory', event.value)
                  }
                />
                <label
                  className="field-label agent-detail-model-memory-label"
                  htmlFor="agent-detail-enable-memory"
                >
                  {t('enable_memory_support')}
                </label>
              </div>
            </div>
          </div>

          <div className="agent-detail-model-sliders-row">
            <div className="form-field">
              <label className="field-label">{t('temperature')}</label>
              <div className="agent-detail-model-slider temperature-slider">
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={Math.round(parseFloat(temperature || '0') * 10)}
                    onChange={(event) => {
                      const sliderValue = parseInt(event.target.value, 10) / 10
                      onFieldChange('temperature', sliderValue.toString())
                    }}
                    className="w-full"
                    title={temperature}
                  />
                  <div
                    className="slider-tooltip"
                    style={{
                      left: `calc(${((parseFloat(temperature || '0') * 10) / 10) * 100}% - 15px)`,
                    }}
                  >
                    {temperature}
                  </div>
                </div>
                <div className="temperature-labels">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">{t('recursion_limit')}</label>
              <div className="agent-detail-model-slider recursion-limit-slider">
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={recursionLimit}
                    onChange={(event) =>
                      onFieldChange('recursionLimit', event.target.value)
                    }
                    className="w-full"
                    title={recursionLimit}
                  />
                  <div
                    className="slider-tooltip"
                    style={{
                      left: `calc(${((parseInt(recursionLimit, 10) - 1) / 99) * 100}% - 15px)`,
                    }}
                  >
                    {recursionLimit}
                  </div>
                </div>
                <div className="recursion-limit-labels">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {isSelfHosted && (
            <div className="agent-detail-model-self-hosted-row">
              <div className="form-field">
                <label className="field-label">
                  {t('self_hosted_url')}
                  <span className="agent-detail-required"> *</span>
                </label>
                <InputText
                  value={selfHostedUrl}
                  onChange={(event) =>
                    onFieldChange('selfHostedUrl', event.target.value)
                  }
                  className={`w-full${!selfHostedUrl.trim() ? ' p-invalid' : ''}`}
                  placeholder={t('enter_self_hosted_url')}
                />
              </div>

              <div className="form-field">
                <label className="field-label">
                  {t('authorization_header_name')} ({t('optional')})
                </label>
                <InputText
                  value={selfHostedAuthHeaderName}
                  onChange={(event) =>
                    onFieldChange(
                      'selfHostedAuthHeaderName',
                      event.target.value
                    )
                  }
                  className="w-full"
                  placeholder={t('enter_authorization_header_name')}
                />
              </div>

              <div className="form-field">
                <label className="field-label">
                  {t('authorization_token')} ({t('optional')})
                </label>
                <Dropdown
                  value={selfHostedTokenId || null}
                  options={tokenOptions}
                  onChange={(event) =>
                    onFieldChange('selfHostedTokenId', event.value ?? '')
                  }
                  className="w-full"
                  placeholder={
                    tokensLoading ? t('loading_tokens') : t('select_token')
                  }
                  disabled={tokensLoading}
                  showClear
                  appendTo="self"
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
