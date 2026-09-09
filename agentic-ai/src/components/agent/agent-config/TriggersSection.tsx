import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { MultiSelect } from 'primereact/multiselect'
import { Message } from 'primereact/message'
import { Tooltip } from 'primereact/tooltip'
import { getTriggerTypes } from '../../../utils/constants'
import { type AgentCommerceFilterDsl } from '../../../utils/agentFilterDslHelpers'
import { hasChannelTrigger } from '../../../utils/agentTriggerValidationHelpers'
import { IamScope } from '../../../services/iamScopesService'
import { AgentFilterDslEditor } from './AgentFilterDslEditor'
import starsIcon from '../../../assets/stars_icon.svg'

type TriggersSectionProps = {
  readonly triggerTypes: string[]
  readonly commerceEvents: string[]
  readonly commerceEventFilter: AgentCommerceFilterDsl | null
  readonly eventScopes: string[]
  readonly requiredScopes: string[]
  readonly onFieldChange: (
    field: string,
    value: string[] | AgentCommerceFilterDsl | null
  ) => void
  readonly commerceEventCatalog: string[]
  readonly commerceCatalogLoading: boolean
  readonly commerceCatalogError: string | null
  readonly iamScopes: IamScope[]
  readonly iamScopesLoading: boolean
  readonly iamScopesLoadError: string | null
  readonly msTeamsEnabled?: boolean
}

export const TriggersSection = ({
  triggerTypes,
  commerceEvents,
  commerceEventFilter,
  eventScopes,
  requiredScopes,
  onFieldChange,
  commerceEventCatalog,
  commerceCatalogLoading,
  commerceCatalogError,
  iamScopes,
  iamScopesLoading,
  iamScopesLoadError,
  msTeamsEnabled = false,
}: TriggersSectionProps) => {
  const { t } = useTranslation()
  const [assistantDialogVisible, setAssistantDialogVisible] = useState(false)

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
    const allTriggerTypes = getTriggerTypes(t)
    return allTriggerTypes.filter(
      (option) => option.value !== 'teams' || msTeamsEnabled
    )
  }, [t, msTeamsEnabled])

  const isCommerceTriggerSelected = triggerTypes.includes('commerce_events')
  const showChannelTriggerHint = hasChannelTrigger(triggerTypes)

  const handleMultiTriggerChange = (next: string[]) => {
    const wasCommerce = triggerTypes.includes('commerce_events')
    const isCommerce = next.includes('commerce_events')
    onFieldChange('triggerTypes', next)
    if (!wasCommerce && isCommerce) {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
      onFieldChange('eventScopes', [])
    } else if (wasCommerce && !isCommerce) {
      onFieldChange('commerceEvents', [])
      onFieldChange('commerceEventFilter', null)
      onFieldChange('eventScopes', [])
    }
  }

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

  const eventScopeOptions = useMemo(() => {
    const catalogIds = new Set(iamScopes.map((scope) => scope.id))
    const selectedOptions = eventScopes
      .filter((scopeId) => scopeId.trim() && !catalogIds.has(scopeId))
      .map((scopeId) => ({ label: scopeId, value: scopeId }))
    const catalogOptions = iamScopes.map((scope) => ({
      label: scope.id,
      value: scope.id,
    }))

    return [...selectedOptions, ...catalogOptions]
  }, [iamScopes, eventScopes])

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

  const renderCommerceEventsField = () => (
    <div
      className={`form-field agent-detail-commerce-events-field${isCommerceTriggerSelected ? '' : ' agent-detail-commerce-events-field--disabled'}`}
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
          commerceCatalogLoading ? t('loading_events') : t('select_an_option')
        }
        disabled={!isCommerceTriggerSelected}
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

  const renderEventScopesField = () => (
    <div
      className={`form-field agent-detail-commerce-events-field${isCommerceTriggerSelected ? '' : ' agent-detail-commerce-events-field--disabled'}`}
    >
      <label className="field-label">
        {t('event_scopes')}
        <i
          className="pi pi-info-circle field-label-help-icon event-scopes-help-icon"
          data-pr-tooltip={t('event_scopes_tooltip')}
          data-pr-position="top"
        />
      </label>
      <Tooltip target=".event-scopes-help-icon" />
      {isCommerceTriggerSelected && iamScopesLoadError ? (
        <Message severity="warn" text={iamScopesLoadError} />
      ) : null}
      <MultiSelect
        value={isCommerceTriggerSelected ? eventScopes : []}
        options={eventScopeOptions}
        onChange={(e) => {
          if (!isCommerceTriggerSelected || iamScopesLoading) {
            return
          }
          onFieldChange('eventScopes', (e.value as string[]) ?? [])
        }}
        className={`w-full${iamScopesLoading && isCommerceTriggerSelected ? ' agent-detail-commerce-events-field--loading' : ''}`}
        display="chip"
        filter={isCommerceTriggerSelected && !iamScopesLoading}
        placeholder={t('select_event_scopes')}
        appendTo="self"
        disabled={!isCommerceTriggerSelected || iamScopesLoading}
      />
    </div>
  )

  const renderConstraintsEditor = () => {
    if (!isCommerceTriggerSelected) {
      return null
    }

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
              <span className="p-button-label">{t('generate_condition')}</span>
            </span>
          </Button>
        </div>
        <section className="agent-detail-section agent-detail-constraints-card">
          <AgentFilterDslEditor
            value={commerceEventFilter}
            onChange={(value) => onFieldChange('commerceEventFilter', value)}
            layout="split"
            assistantDialogVisible={assistantDialogVisible}
            onAssistantDialogVisibleChange={setAssistantDialogVisible}
          />
        </section>
      </div>
    )
  }

  const renderChannelTriggerHint = () =>
    showChannelTriggerHint ? (
      <small className="text-muted">{t('channel_trigger_tool_hint')}</small>
    ) : null

  return (
    <div className="agent-detail-triggers-tab">
      <div className="agent-detail-triggers-section">
        <h2 className="agent-detail-section-title">
          {t('triggers_section_title')}
        </h2>
        <section className="agent-detail-section">
          <div className="agent-detail-form-row">
            {renderRequiredScopes()}
            {renderEventScopesField()}
          </div>

          <div className="agent-detail-form-row">
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
              />
              {renderChannelTriggerHint()}
            </div>

            {renderCommerceEventsField()}
          </div>
        </section>
      </div>

      {renderConstraintsEditor()}
    </div>
  )
}
