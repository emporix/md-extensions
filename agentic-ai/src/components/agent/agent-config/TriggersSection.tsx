import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { Tooltip } from 'primereact/tooltip'
import { getTriggerTypes } from '../../../utils/constants'
import { AppState } from '../../../types/common'
import { type AgentCommerceFilterDsl } from '../../../utils/agentFilterDslHelpers'
import { AgentFilterDslEditor } from './AgentFilterDslEditor'
import starsIcon from '../../../assets/stars_icon.svg'

interface TriggersSectionProps {
  agentType: string
  triggerTypes: string[]
  commerceEvents: string[]
  commerceEventFilter: AgentCommerceFilterDsl | null
  requiredScopes: string[]
  onFieldChange: (
    field: string,
    value: string[] | AgentCommerceFilterDsl | null
  ) => void
  appState: AppState
  variant?: 'detail' | 'inline'
  commerceEventCatalog: string[]
  commerceCatalogLoading: boolean
  commerceCatalogError: string | null
}

export const TriggersSection: React.FC<TriggersSectionProps> = ({
  agentType,
  triggerTypes,
  commerceEvents,
  commerceEventFilter,
  requiredScopes,
  onFieldChange,
  appState,
  variant = 'detail',
  commerceEventCatalog,
  commerceCatalogLoading,
  commerceCatalogError,
}) => {
  const { t } = useTranslation()
  const [assistantDialogVisible, setAssistantDialogVisible] = useState(false)
  const isDetailVariant = variant === 'detail'

  const scopeOptions = useMemo(
    () => [
      { label: t('scope_anonymous'), value: 'anonymous' },
      { label: t('scope_customer'), value: 'customer' },
      { label: t('scope_employee'), value: 'employee' },
      { label: t('scope_integration'), value: 'integration' },
    ],
    [t]
  )

  const availableTriggerTypes = useMemo(() => {
    const triggerTypes = getTriggerTypes(t)
    return agentType === 'support'
      ? triggerTypes.filter((option) => option.value === 'slack')
      : triggerTypes.filter((option) => option.value !== 'slack')
  }, [t, agentType])

  const selectedTrigger = isDetailVariant ? (triggerTypes[0] ?? null) : null
  const isCommerceTriggerSelected = isDetailVariant
    ? selectedTrigger === 'commerce_events'
    : triggerTypes.includes('commerce_events')

  const handleTriggerChange = (value: string | null) => {
    const wasCommerce = triggerTypes.includes('commerce_events')
    const nextTypes = value ? [value] : []
    onFieldChange('triggerTypes', nextTypes)

    if (!wasCommerce && value === 'commerce_events') {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
    } else if (wasCommerce && value !== 'commerce_events') {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
    }
  }

  const handleMultiTriggerChange = (next: string[]) => {
    const wasCommerce = triggerTypes.includes('commerce_events')
    const isCommerce = next.includes('commerce_events')
    onFieldChange('triggerTypes', next)
    if (!wasCommerce && isCommerce) {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
    } else if (wasCommerce && !isCommerce) {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
    }
  }

  const isCommerceEventsFieldEnabled = isCommerceTriggerSelected

  const commerceEventOptions = useMemo(() => {
    const catalogSet = new Set(commerceEventCatalog)
    const selectedOptions = commerceEvents
      .filter((event) => !catalogSet.has(event))
      .map((event) => ({ label: event, value: event }))
    const catalogOptions = commerceEventCatalog.map((event) => ({
      label: event,
      value: event,
    }))

    return [...selectedOptions, ...catalogOptions]
  }, [commerceEventCatalog, commerceEvents])

  const renderRequiredScopes = () => (
    <div className="form-field">
      <label className="field-label">
        {t('required_scopes')}
        <i
          className="pi pi-info-circle field-label-help-icon triggers-section-help-icon"
          data-pr-tooltip={t('required_scopes_tooltip')}
          data-pr-position="top"
        />
      </label>
      <Tooltip target=".triggers-section-help-icon" />
      <MultiSelect
        value={requiredScopes}
        options={scopeOptions}
        onChange={(e) => onFieldChange('requiredScopes', e.value)}
        className="w-full"
        display="chip"
        placeholder={t('select_required_scopes')}
        appendTo="self"
      />
    </div>
  )

  const renderCommerceEventsField = (alwaysVisible: boolean) => {
    if (!alwaysVisible && !isCommerceTriggerSelected) {
      return null
    }

    return (
      <div
        className={`form-field agent-detail-commerce-events-field${isCommerceEventsFieldEnabled ? '' : ' agent-detail-commerce-events-field--disabled'}`}
      >
        <label className="field-label">
          {t('commerce_events')}
          {isCommerceTriggerSelected ? (
            <span className="field-required-mark"> *</span>
          ) : null}
        </label>
        <MultiSelect
          value={isCommerceTriggerSelected ? commerceEvents : []}
          options={commerceEventOptions}
          onChange={(e) => {
            if (!isCommerceTriggerSelected || commerceCatalogLoading) {
              return
            }
            onFieldChange('commerceEvents', (e.value as string[]) ?? [])
          }}
          className={`w-full ${isCommerceTriggerSelected && commerceEvents.length === 0 ? 'p-invalid' : ''}${commerceCatalogLoading && isCommerceTriggerSelected ? ' agent-detail-commerce-events-field--loading' : ''}`}
          display="chip"
          showClear={isCommerceTriggerSelected}
          maxSelectedLabels={3}
          placeholder={
            commerceCatalogLoading
              ? t('loading_events')
              : isDetailVariant
                ? t('select_an_option')
                : t('select_events_placeholder')
          }
          disabled={!isCommerceEventsFieldEnabled}
          appendTo="self"
          filter={isCommerceTriggerSelected && !commerceCatalogLoading}
        />
        {isCommerceTriggerSelected &&
          !commerceCatalogLoading &&
          commerceEventCatalog.length === 0 &&
          !commerceCatalogError && (
            <small className="state-empty text-muted">
              {t('no_events_available')}
            </small>
          )}
        {commerceCatalogError ? (
          <small className="p-error">{commerceCatalogError}</small>
        ) : null}
      </div>
    )
  }

  const renderConstraintsEditor = () => {
    if (!isCommerceTriggerSelected) {
      return null
    }

    if (isDetailVariant) {
      return (
        <div className="agent-detail-constraints-section">
          <div className="agent-detail-constraints-header">
            <h2 className="agent-detail-section-title">{t('constraints')}</h2>
            <Button
              type="button"
              className="p-button-outlined agent-detail-generate-condition-btn"
              onClick={() => setAssistantDialogVisible(true)}
            >
              <span className="agent-detail-generate-condition-btn-content">
                <img
                  src={starsIcon}
                  alt=""
                  className="agent-detail-generate-condition-btn-icon"
                  aria-hidden="true"
                />
                <span className="p-button-label">
                  {t('generate_condition')}
                </span>
              </span>
            </Button>
          </div>
          <section className="agent-detail-section agent-detail-constraints-card">
            <AgentFilterDslEditor
              value={commerceEventFilter}
              onChange={(value) => onFieldChange('commerceEventFilter', value)}
              appState={appState}
              layout="split"
              assistantDialogVisible={assistantDialogVisible}
              onAssistantDialogVisibleChange={setAssistantDialogVisible}
            />
          </section>
        </div>
      )
    }

    return (
      <div className="constraints-card">
        <h3 className="constraints-card-title">{t('constraints')}</h3>
        <AgentFilterDslEditor
          value={commerceEventFilter}
          onChange={(value) => onFieldChange('commerceEventFilter', value)}
          appState={appState}
        />
      </div>
    )
  }

  if (!isDetailVariant) {
    return (
      <>
        <div className="form-field">
          <label className="field-label">{t('trigger_types')}</label>
          <MultiSelect
            value={triggerTypes}
            options={availableTriggerTypes}
            onChange={(e) =>
              handleMultiTriggerChange((e.value as string[]) ?? [])
            }
            className="w-full"
            display="chip"
            placeholder={t('select_trigger_types')}
            appendTo="self"
            disabled={agentType === 'support'}
          />
        </div>

        {renderRequiredScopes()}
        {renderCommerceEventsField(false)}
        {renderConstraintsEditor()}
      </>
    )
  }

  return (
    <div className="agent-detail-triggers-tab">
      <div className="agent-detail-triggers-section">
        <h2 className="agent-detail-section-title">
          {t('triggers_section_title')}
        </h2>
        <section className="agent-detail-section">
          <div className="agent-detail-form-row">{renderRequiredScopes()}</div>

          <div className="agent-detail-form-row">
            <div className="form-field">
              <label className="field-label">{t('trigger')}</label>
              <Dropdown
                value={selectedTrigger}
                options={availableTriggerTypes}
                onChange={(e) => handleTriggerChange(e.value as string | null)}
                className="w-full"
                placeholder={t('select_an_option')}
                appendTo="self"
                disabled={agentType === 'support'}
                showClear={agentType !== 'support'}
              />
            </div>

            {renderCommerceEventsField(true)}
          </div>
        </section>
      </div>

      {renderConstraintsEditor()}
    </div>
  )
}
