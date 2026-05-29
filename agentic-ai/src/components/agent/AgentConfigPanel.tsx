import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { CustomAgent, LocalizedString } from '../../types/Agent'
import { AppState } from '../../types/common'
import { IconPicker } from '../shared/IconPicker'
import { TagPicker } from '../shared/TagPicker'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { McpServersSelector } from './McpServersSelector'
import { NativeToolsSelector } from './NativeToolsSelector'
import { AgentCollaborationManager } from './AgentCollaborationManager'
import { AgentHeader } from './agent-config/AgentHeader'
import { AgentBasicInfo } from './agent-config/AgentBasicInfo'
import { LlmConfigSection } from './agent-config/LlmConfigSection'
import { useAgentConfig } from '../../hooks/useAgentConfig'
import { usePanelAnimation } from '../../hooks/usePanelAnimation'
import type { AgentCommerceFilterDsl } from '../../utils/agentFilterDslHelpers'

interface AgentConfigPanelProps {
  visible: boolean
  agent: CustomAgent | null
  onHide: () => void
  onSave: (agent: CustomAgent) => void
  appState: AppState
  availableAgents: CustomAgent[]
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  visible,
  agent,
  onHide,
  onSave,
  appState,
  availableAgents,
}) => {
  const { t } = useTranslation()
  const [showIconPicker, setShowIconPicker] = React.useState(false)
  const [showTagPicker, setShowTagPicker] = React.useState(false)

  const {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid,
    showDisableConfirm,
    disableConfirmMessage,
    handleConfirmDisable,
    handleCancelDisable,
  } = useAgentConfig({
    agent,
    appState,
    onSave,
    onHide,
  })

  const { isVisible, isClosing, handleClose, handleBackdropClick } =
    usePanelAnimation({
      visible,
      onHide,
    })

  if (!isVisible) return null

  const handleFieldChange = (
    field: string,
    value:
      | string
      | boolean
      | string[]
      | LocalizedString
      | AgentCommerceFilterDsl
      | null
  ) => {
    updateField(field, value)
  }

  return (
    <>
      <div
        className={`agent-config-backdrop ${!isClosing ? 'backdrop-visible' : ''}`}
        onClick={handleBackdropClick}
      />

      <div className="agent-config-panel">
        <AgentHeader
          agentName={state.agentName}
          selectedIcon={state.selectedIcon}
          selectedTag={state.tags.length > 0 ? state.tags[0] : null}
          onIconClick={() => setShowIconPicker(true)}
          onTagClick={() => setShowTagPicker(true)}
          appState={appState}
        />

        <div className="agent-config-content">
          <AgentBasicInfo
            agentId={state.agentId}
            agentName={state.agentName}
            description={state.description}
            agentType={state.agentType}
            triggerTypes={state.triggerTypes}
            prompt={state.prompt}
            commerceEvents={state.commerceEvents}
            commerceEventFilter={state.commerceEventFilter}
            templatePrompt={state.templatePrompt}
            requiredScopes={state.requiredScopes}
            isEditing={!!agent?.id}
            onFieldChange={handleFieldChange}
            appState={appState}
          />

          <McpServersSelector
            mcpServers={state.mcpServers}
            onChange={(servers) => updateField('mcpServers', servers)}
            appState={appState}
          />

          <NativeToolsSelector
            nativeTools={state.nativeTools}
            onChange={(tools) => updateField('nativeTools', tools)}
            appState={appState}
          />
          <AgentCollaborationManager
            collaborations={state.agentCollaborations}
            onChange={(collaborations) =>
              updateField('agentCollaborations', collaborations)
            }
            availableAgents={availableAgents}
            currentAgentId={agent?.id}
            currentAgentType={state.agentType}
            appState={appState}
          />

          <LlmConfigSection
            model={state.model}
            temperature={state.temperature}
            maxTokens={state.maxTokens}
            provider={state.provider}
            tokenId={state.tokenId}
            recursionLimit={state.recursionLimit}
            enableMemory={state.enableMemory}
            isEditing={!!agent?.id}
            appState={appState}
            onFieldChange={handleFieldChange}
            selfHostedUrl={state.selfHostedUrl}
            selfHostedAuthHeaderName={state.selfHostedAuthHeaderName}
            selfHostedTokenId={state.selfHostedTokenId}
          />

          <div className="panel-actions">
            <Button
              type="button"
              label={t('cancel')}
              className="p-button-secondary"
              onClick={handleClose}
            />
            <Button
              type="button"
              label={t('save')}
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
            />
          </div>
        </div>
      </div>

      <IconPicker
        visible={showIconPicker}
        selectedIcon={state.selectedIcon}
        onIconSelect={(icon) => updateField('selectedIcon', icon)}
        onClose={() => setShowIconPicker(false)}
      />

      <TagPicker
        visible={showTagPicker}
        selectedTag={state.tags.length > 0 ? state.tags[0] : null}
        onTagSelect={(tag) => updateField('tags', tag ? [tag] : [])}
        onClose={() => setShowTagPicker(false)}
      />

      <ConfirmDialog
        visible={showDisableConfirm}
        title={t('confirm_save_agent')}
        message={t('confirm_disable_agent_message', {
          detail: disableConfirmMessage,
        })}
        confirmLabel={t('save_and_deactivate')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmDisable}
        onHide={handleCancelDisable}
        severity="warning"
      />
    </>
  )
}

export default AgentConfigPanel
