import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { ProgressSpinner } from 'primereact/progressspinner'
import { McpServer, NativeTool } from '../../../types/Agent'
import { McpServer as ManagedMcpServer } from '../../../types/Mcp'
import { Tool } from '../../../types/Tool'
import { MCP_SERVERS, McpKey } from '../../../utils/constants'
import {
  formatDomainSectionTitle,
  getDomainSectionTags,
  getNativeToolSectionTags,
  getNativeToolTags,
  getSelectedDomainTools,
  getSelectedDynamicMcpTools,
  formatManagedMcpServerLabel,
  hasManagedMcpAttachmentsChanged,
  isManagedAgentMcp,
  normalizeManagedMcpAttachments,
  toggleDomainTool,
  toggleDynamicMcpTool,
  toggleManagedMcpServer,
  toggleNativeTool,
} from '../../../utils/agentToolsHelpers'
import {
  getDynamicMcpToolCounts,
  getEnabledDynamicToolNames,
  isDynamicMcpServer,
} from '../../../utils/mcpHelpers'
import { AgentToolTypeTags } from '../../shared/AgentToolTypeTags'
import { NestedCheckboxList } from './NestedCheckboxList'
import { isCommunicationNativeToolType } from '../../../utils/communicationRoutingHelpers'
import {
  getSlackToolAllowedOperations,
  toggleSlackNativeTool,
  updateSlackNativeToolAllowedOperations,
} from '../../../utils/slackRoutingHelpers'
import {
  getToolAllowedOperations,
  toggleTeamsNativeTool,
  updateTeamsNativeToolAllowedOperations,
} from '../../../utils/teamsRoutingHelpers'

interface ToolsSectionProps {
  mcpServers: McpServer[]
  nativeTools: NativeTool[]
  availableTools: Tool[]
  availableMcpServers: ManagedMcpServer[]
  toolsLoading: boolean
  mcpServersLoading: boolean
  onFieldChange: (
    field: 'mcpServers' | 'nativeTools',
    value: McpServer[] | NativeTool[]
  ) => void
}

type ToolsAccordionSectionId = McpKey | 'native' | 'custom'

interface ToolListItem {
  id: string
  label: string
  description?: string
  disabled?: boolean
  tags?: string[]
  toolType?: string
}

interface ToolsAccordionSectionProps {
  sectionId: ToolsAccordionSectionId
  title: string
  tags: string[]
  selectedItems: ToolListItem[]
  availableItems: ToolListItem[]
  isExpanded: boolean
  isLoading?: boolean
  loadingLabel?: string
  selectedCountLabelKey?: string
  noSelectedLabelKey?: string
  showItemTags?: boolean
  renderItemRowSuffix?: (
    item: ToolListItem,
    isSelected: boolean
  ) => React.ReactNode
  renderSelectedItemExtension?: (
    item: ToolListItem,
    isSelected: boolean
  ) => React.ReactNode
  onToggleExpand: (sectionId: ToolsAccordionSectionId) => void
  onToggleItem: (itemId: string, checked: boolean) => void
  onRemoveItem: (itemId: string) => void
}

const ToolsAccordionSection: React.FC<ToolsAccordionSectionProps> = ({
  sectionId,
  title,
  tags,
  selectedItems,
  availableItems,
  isExpanded,
  isLoading = false,
  loadingLabel,
  selectedCountLabelKey = 'selected_tools_count',
  noSelectedLabelKey = 'no_tools_selected',
  showItemTags = false,
  renderItemRowSuffix,
  renderSelectedItemExtension,
  onToggleExpand,
  onToggleItem,
  onRemoveItem,
}) => {
  const { t } = useTranslation()
  const selectedCount = selectedItems.length

  return (
    <div
      className={`agent-detail-tools-accordion${isExpanded ? ' agent-detail-tools-accordion--expanded' : ''}`}
    >
      <button
        type="button"
        className="agent-detail-tools-accordion-header"
        aria-expanded={isExpanded}
        aria-controls={`agent-tools-section-${sectionId}`}
        aria-label={isExpanded ? t('collapse_section') : t('expand_section')}
        onClick={() => onToggleExpand(sectionId)}
      >
        <i
          className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} agent-detail-tools-accordion-chevron`}
          aria-hidden="true"
        />
        <div className="agent-detail-tools-accordion-header-content">
          <div className="agent-detail-tools-accordion-left">
            <span className="agent-detail-tools-accordion-title">{title}</span>
            <div className="agent-detail-tools-tags">
              {tags.map((tag) => (
                <span key={tag} className="agent-detail-tools-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="agent-detail-tools-accordion-right">
            <span className="agent-detail-tools-selection-label">
              {selectedCount > 0
                ? t(selectedCountLabelKey, { count: selectedCount })
                : t(noSelectedLabelKey)}
            </span>
            {selectedCount > 0 ? (
              <div className="agent-detail-tools-selected-chips">
                {selectedItems.map((item) => (
                  <span key={item.id} className="agent-detail-tools-chip">
                    <span className="agent-detail-tools-chip-label">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      className="agent-detail-tools-chip-remove"
                      aria-label={t('remove_tool')}
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemoveItem(item.id)
                      }}
                    >
                      <i className="pi pi-times-circle" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div
          id={`agent-tools-section-${sectionId}`}
          className="agent-detail-tools-accordion-body"
        >
          <div className="agent-detail-tools-accordion-body-inner">
            <span className="agent-detail-tools-available-heading">
              {t('available_tools_list_heading')}
            </span>
            {isLoading ? (
              <div className="agent-detail-tools-loading">
                <ProgressSpinner style={{ width: '24px', height: '24px' }} />
                <span>{loadingLabel ?? t('loading_tools')}</span>
              </div>
            ) : (
              <div className="agent-detail-tools-scroll">
                {availableItems.map((item) => {
                  const isSelected = selectedItems.some(
                    (selected) => selected.id === item.id
                  )
                  const isSelectionBlocked = Boolean(item.disabled && !isSelected)
                  const extension = renderSelectedItemExtension?.(
                    item,
                    isSelected
                  )

                  return (
                    <div
                      key={item.id}
                      className={`agent-detail-tools-item${item.disabled ? ' agent-detail-tools-item--disabled' : ''}`}
                    >
                      <label
                        className={`agent-detail-tools-row${isSelectionBlocked ? ' agent-detail-tools-row--disabled' : ''}`}
                        htmlFor={`agent-tool-${sectionId}-${item.id}`}
                      >
                        <Checkbox
                          inputId={`agent-tool-${sectionId}-${item.id}`}
                          checked={isSelected}
                          disabled={isSelectionBlocked}
                          onChange={(event) => {
                            const checked = event.checked ?? false
                            if (item.disabled && checked) {
                              return
                            }
                            onToggleItem(item.id, checked)
                          }}
                        />
                        <span className="agent-detail-tools-row-label-wrap">
                          <span className="agent-detail-tools-row-label">
                            <span>{item.label}</span>
                            {showItemTags && item.tags?.length ? (
                              <AgentToolTypeTags tags={item.tags} />
                            ) : null}
                            {renderItemRowSuffix?.(item, isSelected)}
                          </span>
                          {item.description ? (
                            <span className="agent-detail-tools-row-description">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                      {extension ? (
                        <div className="agent-detail-tools-row-extension">
                          {extension}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const matchesSearch = (query: string, values: string[]): boolean => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => value.toLowerCase().includes(normalizedQuery))
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  mcpServers,
  nativeTools,
  availableTools,
  availableMcpServers,
  toolsLoading,
  mcpServersLoading,
  onFieldChange,
}) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<
    Set<ToolsAccordionSectionId>
  >(new Set())

  const sortedDomains = useMemo(
    () =>
      (Object.keys(MCP_SERVERS) as McpKey[]).sort((a, b) =>
        MCP_SERVERS[a].name.localeCompare(MCP_SERVERS[b].name)
      ),
    []
  )

  const handleToggleSection = useCallback(
    (sectionId: ToolsAccordionSectionId) => {
      setExpandedSections((prev) => {
        const next = new Set(prev)
        if (next.has(sectionId)) {
          next.delete(sectionId)
        } else {
          next.add(sectionId)
        }
        return next
      })
    },
    []
  )

  const handleDomainToolToggle = useCallback(
    (domain: McpKey, toolId: string, checked: boolean) => {
      onFieldChange(
        'mcpServers',
        toggleDomainTool(mcpServers, domain, toolId, checked)
      )
    },
    [mcpServers, onFieldChange]
  )

  const handleNativeToolToggle = useCallback(
    (toolId: string, checked: boolean) => {
      const tool = availableTools.find((item) => item.id === toolId)
      if (checked && tool?.enabled === false) {
        return
      }
      let nextNativeTools = nativeTools
      if (tool?.type === 'teams') {
        nextNativeTools = toggleTeamsNativeTool(
          nativeTools,
          availableTools,
          toolId,
          checked
        )
      } else if (tool?.type === 'slack') {
        nextNativeTools = toggleSlackNativeTool(
          nativeTools,
          availableTools,
          toolId,
          checked
        )
      } else {
        nextNativeTools = toggleNativeTool(nativeTools, toolId, checked)
      }

      onFieldChange('nativeTools', nextNativeTools)
    },
    [availableTools, nativeTools, onFieldChange]
  )

  const handleCommunicationOperationToggle = useCallback(
    (toolId: string, operation: string, checked: boolean) => {
      const tool = availableTools.find((item) => item.id === toolId)
      if (!tool || !isCommunicationNativeToolType(tool.type)) {
        return
      }

      const nativeTool = nativeTools.find((entry) => entry.id === toolId)
      const allowedByTool =
        tool.type === 'slack'
          ? getSlackToolAllowedOperations(tool)
          : getToolAllowedOperations(tool)
      const currentOps = nativeTool?.allowedOperations ?? allowedByTool

      if (
        !checked &&
        currentOps.length <= 1 &&
        currentOps.includes(operation)
      ) {
        return
      }

      onFieldChange(
        'nativeTools',
        tool.type === 'slack'
          ? updateSlackNativeToolAllowedOperations(
              nativeTools,
              toolId,
              operation,
              checked,
              tool
            )
          : updateTeamsNativeToolAllowedOperations(
              nativeTools,
              toolId,
              operation,
              checked,
              tool
            )
      )
    },
    [availableTools, nativeTools, onFieldChange]
  )

  const handleCustomMcpToggle = useCallback(
    (serverId: string, checked: boolean) => {
      const managedMcp = availableMcpServers.find((server) => server.id === serverId)
      if (checked && managedMcp?.enabled === false) {
        return
      }
      const mcpType =
        managedMcp && isDynamicMcpServer(managedMcp) ? 'dynamic' : 'custom'
      onFieldChange(
        'mcpServers',
        toggleManagedMcpServer(mcpServers, serverId, checked, mcpType)
      )
    },
    [availableMcpServers, mcpServers, onFieldChange]
  )

  const handleDynamicMcpToolToggle = useCallback(
    (serverId: string, toolName: string, checked: boolean) => {
      const managedMcp = availableMcpServers.find((server) => server.id === serverId)
      const enabledToolNames = getEnabledDynamicToolNames(managedMcp?.tools)
      const currentTools = getSelectedDynamicMcpTools(
        mcpServers,
        serverId,
        enabledToolNames
      )
      if (
        !checked &&
        currentTools.length <= 1 &&
        currentTools.includes(toolName)
      ) {
        return
      }
      onFieldChange(
        'mcpServers',
        toggleDynamicMcpTool(
          mcpServers,
          serverId,
          toolName,
          checked,
          enabledToolNames
        )
      )
    },
    [availableMcpServers, mcpServers, onFieldChange]
  )

  const filterItems = useCallback(
    (items: ToolListItem[]) => {
      if (!searchQuery.trim()) {
        return items
      }

      return items.filter((item) => matchesSearch(searchQuery, [item.label]))
    },
    [searchQuery]
  )

  const isSectionVisible = useCallback(
    (items: ToolListItem[]) => {
      if (!searchQuery.trim()) {
        return true
      }

      return items.some((item) => matchesSearch(searchQuery, [item.label]))
    },
    [searchQuery]
  )

  const matchingSectionIds = useMemo(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      return new Set<ToolsAccordionSectionId>()
    }

    const ids = new Set<ToolsAccordionSectionId>()

    sortedDomains.forEach((domain) => {
      const allItems: ToolListItem[] = MCP_SERVERS[domain].tools.map(
        (toolId) => ({
          id: toolId,
          label: toolId,
        })
      )

      if (isSectionVisible(allItems)) {
        ids.add(domain)
      }
    })

    const nativeAllItems: ToolListItem[] = availableTools.map((tool) => ({
      id: tool.id,
      label: tool.name,
    }))

    if (availableTools.length > 0 && isSectionVisible(nativeAllItems)) {
      ids.add('native')
    }

    const customAllItems: ToolListItem[] = availableMcpServers.map(
      (server) => ({
        id: server.id,
        label: server.name,
      })
    )

    if (availableMcpServers.length > 0 && isSectionVisible(customAllItems)) {
      ids.add('custom')
    }

    return ids
  }, [
    searchQuery,
    sortedDomains,
    availableTools,
    availableMcpServers,
    isSectionVisible,
  ])

  useEffect(() => {
    if (!searchQuery.trim()) {
      return
    }

    setExpandedSections((prev) => {
      const next = new Set(matchingSectionIds)
      if (
        prev.size === next.size &&
        [...prev].every((sectionId) => next.has(sectionId))
      ) {
        return prev
      }
      return next
    })
  }, [searchQuery, matchingSectionIds])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setExpandedSections(new Set())
    }
  }, [searchQuery])

  useEffect(() => {
    if (availableMcpServers.length === 0) {
      return
    }
    const next = normalizeManagedMcpAttachments(mcpServers, availableMcpServers)
    if (hasManagedMcpAttachmentsChanged(mcpServers, next)) {
      onFieldChange('mcpServers', next)
    }
  }, [availableMcpServers, mcpServers, onFieldChange])

  const renderCommunicationNativeToolExtension = useCallback(
    (item: ToolListItem, isSelected: boolean) => {
      if (!isCommunicationNativeToolType(item.toolType) || !isSelected) {
        return null
      }

      const tool = availableTools.find((entry) => entry.id === item.id)
      const nativeTool = nativeTools.find((entry) => entry.id === item.id)
      if (!tool) {
        return null
      }

      const allowedByTool =
        tool.type === 'slack'
          ? getSlackToolAllowedOperations(tool)
          : getToolAllowedOperations(tool)
      const selectedOperations = nativeTool?.allowedOperations ?? allowedByTool

      return (
        <NestedCheckboxList
          title={t(`${tool.type}_agent_allowed_operations`)}
          inputIdPrefix={`agent-${tool.type}-op-${item.id}`}
          items={allowedByTool.map((operation) => ({
            id: operation,
            label: t(`${tool.type}_operation_${operation}`),
            checked: selectedOperations.includes(operation),
          }))}
          onToggle={(operation, checked) =>
            handleCommunicationOperationToggle(item.id, operation, checked)
          }
        />
      )
    },
    [availableTools, handleCommunicationOperationToggle, nativeTools, t]
  )

  const renderDynamicMcpToolExtension = useCallback(
    (item: ToolListItem, isSelected: boolean) => {
      if (!isSelected) {
        return null
      }
      const managedMcp = availableMcpServers.find((server) => server.id === item.id)
      if (!managedMcp || !isDynamicMcpServer(managedMcp)) {
        return null
      }
      const enabledToolNames = getEnabledDynamicToolNames(managedMcp.tools)
      if (enabledToolNames.length === 0) {
        return null
      }
      const selectedTools = getSelectedDynamicMcpTools(
        mcpServers,
        item.id,
        enabledToolNames
      )

      return (
        <NestedCheckboxList
          title={t('dynamic_mcp_agent_tools')}
          inputIdPrefix={`agent-dynamic-mcp-tool-${item.id}`}
          items={enabledToolNames.map((toolName) => ({
            id: toolName,
            label: toolName,
            checked: selectedTools.includes(toolName),
          }))}
          onToggle={(toolName, checked) =>
            handleDynamicMcpToolToggle(item.id, toolName, checked)
          }
        />
      )
    },
    [
      availableMcpServers,
      handleDynamicMcpToolToggle,
      mcpServers,
      t,
    ]
  )

  const domainSections = sortedDomains
    .map((domain) => {
      const selectedToolIds = getSelectedDomainTools(mcpServers, domain)
      const title = formatDomainSectionTitle(domain)
      const tags = getDomainSectionTags(domain)
      const allItems: ToolListItem[] = MCP_SERVERS[domain].tools.map(
        (toolId) => ({
          id: toolId,
          label: toolId,
        })
      )
      const selectedItems = selectedToolIds.map((toolId) => ({
        id: toolId,
        label: toolId,
      }))
      const visibleItems = filterItems(allItems)

      if (!isSectionVisible(allItems)) {
        return null
      }

      return (
        <ToolsAccordionSection
          key={domain}
          sectionId={domain}
          title={title}
          tags={tags}
          selectedItems={selectedItems}
          availableItems={visibleItems}
          isExpanded={expandedSections.has(domain)}
          onToggleExpand={handleToggleSection}
          onToggleItem={(toolId, checked) =>
            handleDomainToolToggle(domain, toolId, checked)
          }
          onRemoveItem={(toolId) =>
            handleDomainToolToggle(domain, toolId, false)
          }
        />
      )
    })
    .filter(Boolean)

  const nativeAllItems: ToolListItem[] = availableTools.map((tool) => ({
    id: tool.id,
    label: tool.name,
    tags: getNativeToolTags(tool),
    toolType: tool.type,
    disabled: tool.enabled === false,
  }))
  const nativeSelectedItems: ToolListItem[] = nativeTools
    .map((nativeTool) => {
      const tool = availableTools.find((item) => item.id === nativeTool.id)
      return {
        id: nativeTool.id,
        label: tool?.name ?? nativeTool.id,
        tags: tool ? getNativeToolTags(tool) : undefined,
        toolType: tool?.type,
      }
    })
    .filter((item) => item.id)
  const nativeTags = getNativeToolSectionTags(availableTools)
  const nativeVisibleItems = filterItems(nativeAllItems)
  const showNativeSection =
    availableTools.length > 0 && isSectionVisible(nativeAllItems)

  const getDynamicMcpTags = useCallback(
    (managed: ManagedMcpServer | undefined): string[] | undefined => {
      if (!managed || !isDynamicMcpServer(managed)) {
        return undefined
      }
      return [
        t('dynamic_mcp_tag'),
        t('mcp_tools_count', { count: getDynamicMcpToolCounts(managed).total }),
      ]
    },
    [t]
  )

  const getManagedMcpHeaderLabel = useCallback(
    (
      managed: ManagedMcpServer | undefined,
      serverId: string,
      fallbackName: string
    ): string => {
      if (!managed || !isDynamicMcpServer(managed)) {
        return fallbackName
      }
      const enabledToolNames = getEnabledDynamicToolNames(managed.tools)
      const toolNames = getSelectedDynamicMcpTools(
        mcpServers,
        serverId,
        enabledToolNames
      )
      return formatManagedMcpServerLabel(fallbackName, toolNames, true)
    },
    [mcpServers]
  )

  const customAllItems: ToolListItem[] = availableMcpServers.map((server) => ({
    id: server.id,
    label: server.name,
    disabled: server.enabled === false,
    tags: getDynamicMcpTags(server),
  }))
  const customSelectedItems: ToolListItem[] = mcpServers
    .filter(isManagedAgentMcp)
    .map((server) => {
      const serverId = server.mcpServer?.id ?? ''
      const managed = availableMcpServers.find((item) => item.id === serverId)
      const fallbackName = managed?.name ?? serverId
      return {
        id: serverId,
        label: getManagedMcpHeaderLabel(managed, serverId, fallbackName),
      }
    })
    .filter((item) => item.id)
  const mcpSectionTags = [t('custom_mcp_tag'), t('dynamic_mcp_tag'),]
  const customVisibleItems = filterItems(customAllItems)
  const showCustomSection =
    availableMcpServers.length > 0 && isSectionVisible(customAllItems)

  return (
    <div className="agent-detail-tools-tab">
      <InputText
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t('search_for_tools')}
        className="agent-detail-tools-search"
        aria-label={t('search_for_tools')}
      />

      <h2 className="agent-detail-section-title">{t('available_tools')}</h2>

      <div className="agent-detail-tools-sections">
        {domainSections}

        {showNativeSection ? (
          <ToolsAccordionSection
            sectionId="native"
            title={t('native_tools')}
            tags={nativeTags}
            selectedItems={nativeSelectedItems}
            availableItems={nativeVisibleItems}
            isExpanded={expandedSections.has('native')}
            isLoading={toolsLoading}
            showItemTags
            renderSelectedItemExtension={renderCommunicationNativeToolExtension}
            onToggleExpand={handleToggleSection}
            onToggleItem={handleNativeToolToggle}
            onRemoveItem={(toolId) => handleNativeToolToggle(toolId, false)}
          />
        ) : null}

        {showCustomSection ? (
          <ToolsAccordionSection
            sectionId="custom"
            title={t('mcp_servers')}
            tags={mcpSectionTags}
            selectedItems={customSelectedItems}
            availableItems={customVisibleItems}
            isExpanded={expandedSections.has('custom')}
            isLoading={mcpServersLoading}
            loadingLabel={t('loading_mcp_servers')}
            selectedCountLabelKey="selected_mcp_servers_count"
            noSelectedLabelKey="no_mcp_servers_selected"
            showItemTags
            renderSelectedItemExtension={renderDynamicMcpToolExtension}
            onToggleExpand={handleToggleSection}
            onToggleItem={handleCustomMcpToggle}
            onRemoveItem={(serverId) => handleCustomMcpToggle(serverId, false)}
          />
        ) : null}
      </div>
    </div>
  )
}
