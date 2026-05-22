import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { MultiSelect } from 'primereact/multiselect'
import { Tooltip } from 'primereact/tooltip'
import { TRIGGER_TYPES } from '../../../utils/constants'
import { AppState } from '../../../types/common'
import { LocalizedString } from '../../../types/Agent'
import { LocalizedInput } from '../../shared/LocalizedInput'
import { hasAnyLocalizedValue } from '../../../utils/agentHelpers'
import { sanitizeIdInput } from '../../../utils/validation'
import { type AgentCommerceFilterDsl } from '../../../utils/agentFilterDslHelpers'
import { AgentFilterDslEditor } from './AgentFilterDslEditor'
import { useCommerceEvents } from '../../../hooks/useCommerceEvents'

interface AgentBasicInfoProps {
  agentId: string
  agentName: LocalizedString
  description: LocalizedString
  agentType: string
  triggerTypes: string[]
  prompt: string
  commerceEvents: string[]
  commerceEventFilter: AgentCommerceFilterDsl | null
  isEditing: boolean
  onFieldChange: (
    field: string,
    value: string | string[] | LocalizedString | AgentCommerceFilterDsl | null
  ) => void
  appState: AppState
  templatePrompt: string
  requiredScopes: string[]
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  agentId,
  agentName,
  description,
  agentType,
  triggerTypes,
  prompt,
  commerceEvents,
  commerceEventFilter,
  templatePrompt,
  requiredScopes,
  isEditing,
  onFieldChange,
  appState,
}) => {
  const { t } = useTranslation()
  const {
    events: commerceEventCatalog,
    loading: commerceCatalogLoading,
    error: commerceCatalogError,
  } = useCommerceEvents(appState)
  const scopeOptions = [
    { label: 'Anonymous', value: 'anonymous' },
    { label: 'Customer', value: 'customer' },
    { label: 'Employee', value: 'employee' },
    { label: 'Integration', value: 'integration' },
  ]

  const availableTriggerTypes =
    agentType === 'support'
      ? TRIGGER_TYPES.filter((option) => option.value === 'slack')
      : TRIGGER_TYPES.filter((option) => option.value !== 'slack')

  const handleAgentIdChange = (value: string) => {
    const sanitized = sanitizeIdInput(value)
    onFieldChange('agentId', sanitized)
  }

  return (
    <>
      <div className="form-field">
        <label className="field-label">
          {t('agent_id')}
          {!isEditing && (
            <span className="field-required-mark"> *</span>
          )}
        </label>
        <InputText
          value={agentId}
          onChange={(e) => handleAgentIdChange(e.target.value)}
          className={`w-full ${!isEditing && !agentId.trim() ? 'p-invalid' : ''}`}
          disabled={isEditing}
          placeholder={
            !isEditing ? t('enter_agent_id') : undefined
          }
        />
        {!isEditing && !agentId.trim() && (
          <small className="p-error">
            {t('agent_id_required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('agent_name')}
          <span className="field-required-mark"> *</span>
        </label>
        <LocalizedInput
          value={agentName}
          onChange={(value) => onFieldChange('agentName', value)}
          appState={appState}
          placeholder={t('enter_agent_name')}
          error={
            !hasAnyLocalizedValue(agentName)
              ? t('agent_name_required')
              : undefined
          }
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('description')}
          <span className="field-required-mark"> *</span>
        </label>
        <LocalizedInput
          value={description}
          onChange={(value) => onFieldChange('description', value)}
          appState={appState}
          placeholder={t('enter_description')}
          error={
            !hasAnyLocalizedValue(description)
              ? t('description_required')
              : undefined
          }
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('required_scopes')}
          <i
            className="pi pi-info-circle field-label-help-icon"
            data-pr-tooltip={t('required_scopes_tooltip')}
            data-pr-position="top"
          />
        </label>
        <Tooltip target=".pi-info-circle" />
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

      <div className="form-field">
        <label className="field-label">
          {t('trigger_types')}
        </label>
        <MultiSelect
          value={triggerTypes}
          options={availableTriggerTypes}
          onChange={(e) => {
            const next = (e.value as string[]) || []
            const wasCommerce = triggerTypes.includes('commerce_events')
            const isCommerce = next.includes('commerce_events')
            onFieldChange('triggerTypes', next)
            if (!wasCommerce && isCommerce) {
              onFieldChange('commerceEvents', [])
              onFieldChange('commerceEventFilter', null)
            }
          }}
          className="w-full"
          display="chip"
          placeholder={t('select_trigger_types')}
          appendTo="self"
          disabled={agentType === 'support'}
        />
      </div>

      {triggerTypes.includes('commerce_events') && (
        <>
          <div className="form-field">
            <label className="field-label">
              {t('commerce_events')}
              <span className="field-required-mark"> *</span>
            </label>
            <MultiSelect
              value={commerceEvents}
              options={commerceEventCatalog.map((e) => ({
                label: e,
                value: e,
              }))}
              onChange={(e) =>
                onFieldChange('commerceEvents', (e.value as string[]) || [])
              }
              className={`w-full ${commerceEvents.length === 0 ? 'p-invalid' : ''}`}
              display="chip"
              showClear
              maxSelectedLabels={3}
              placeholder={
                commerceCatalogLoading
                  ? t('loading_events')
                  : t('select_events_placeholder')
              }
              disabled={commerceCatalogLoading}
              appendTo="self"
              filter
            />
            {!commerceCatalogLoading &&
              commerceEventCatalog.length === 0 &&
              !commerceCatalogError && (
                <small className="state-empty text-muted">
                  {t('no_events_available')}
                </small>
              )}
            {commerceCatalogError ? (
              <small className="p-error">{commerceCatalogError}</small>
            ) : null}
            {commerceEvents.length === 0 ? (
              <small className="p-error">
                {t('commerce_events_required')}
              </small>
            ) : null}
          </div>
          <div className="form-field">
            <label className="field-label">
              {t('commerce_event_filter')}
              <span className="text-muted">
                {' '}
                {t('commerce_event_filter_optional')}
              </span>
            </label>
            <AgentFilterDslEditor
              value={commerceEventFilter}
              onChange={(v) => onFieldChange('commerceEventFilter', v)}
            />
          </div>
        </>
      )}

      {templatePrompt && (
        <div className="form-field">
          <label className="field-label">
            {t('template_prompt')}
          </label>
          <InputTextarea
            value={templatePrompt}
            rows={15}
            className="w-full readonly-textarea"
            readOnly
            placeholder={t('template_prompt_placeholder')}
          />
        </div>
      )}

      <div className="form-field">
        <label className="field-label">
          {t('user_prompt')}
          <span className="field-required-mark"> *</span>
        </label>
        <InputTextarea
          value={prompt}
          onChange={(e) => onFieldChange('prompt', e.target.value)}
          rows={15}
          className={`w-full ${!prompt.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_prompt')}
        />
        {!prompt.trim() && (
          <small className="p-error">
            {t('prompt_required')}
          </small>
        )}
      </div>
    </>
  )
}
