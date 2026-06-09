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
  getSelectedDomainTools,
  toggleCustomMcpServer,
  toggleDomainTool,
  toggleNativeTool,
} from '../../../utils/agentToolsHelpers'

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
  disabled?: boolean
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
                ? t('selected_tools_count', { count: selectedCount })
                : t('no_tools_selected')}
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
                {availableItems.map((item) => (
                  <label
                    key={item.id}
                    className={`agent-detail-tools-row${item.disabled ? ' agent-detail-tools-row--disabled' : ''}`}
                    htmlFor={`agent-tool-${sectionId}-${item.id}`}
                  >
                    <Checkbox
                      inputId={`agent-tool-${sectionId}-${item.id}`}
                      checked={selectedItems.some(
                        (selected) => selected.id === item.id
                      )}
                      disabled={item.disabled}
                      onChange={(event) =>
                        onToggleItem(item.id, event.checked ?? false)
                      }
                    />
                    <span className="agent-detail-tools-row-label">
                      {item.label}
                    </span>
                  </label>
                ))}
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
      onFieldChange(
        'nativeTools',
        toggleNativeTool(nativeTools, toolId, checked)
      )
    },
    [nativeTools, onFieldChange]
  )

  const handleCustomMcpToggle = useCallback(
    (serverId: string, checked: boolean) => {
      onFieldChange(
        'mcpServers',
        toggleCustomMcpServer(mcpServers, serverId, checked)
      )
    },
    [mcpServers, onFieldChange]
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
    disabled: tool.enabled === false,
  }))
  const nativeSelectedItems: ToolListItem[] = nativeTools
    .map((nativeTool) => {
      const tool = availableTools.find((item) => item.id === nativeTool.id)
      return {
        id: nativeTool.id,
        label: tool?.name ?? nativeTool.id,
      }
    })
    .filter((item) => item.id)
  const nativeTags = getNativeToolSectionTags(availableTools)
  const nativeVisibleItems = filterItems(nativeAllItems)
  const showNativeSection =
    availableTools.length > 0 && isSectionVisible(nativeAllItems)

  const customAllItems: ToolListItem[] = availableMcpServers.map((server) => ({
    id: server.id,
    label: server.name,
    disabled: server.enabled === false,
  }))
  const customSelectedItems: ToolListItem[] = mcpServers
    .filter((server) => server.type === 'custom' && server.mcpServer?.id)
    .map((server) => {
      const managed = availableMcpServers.find(
        (item) => item.id === server.mcpServer?.id
      )
      return {
        id: server.mcpServer?.id ?? '',
        label: managed?.name ?? server.mcpServer?.id ?? '',
      }
    })
    .filter((item) => item.id)
  const customTags = [t('custom_mcp_tag')]
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
            onToggleExpand={handleToggleSection}
            onToggleItem={handleNativeToolToggle}
            onRemoveItem={(toolId) => handleNativeToolToggle(toolId, false)}
          />
        ) : null}

        {showCustomSection ? (
          <ToolsAccordionSection
            sectionId="custom"
            title={t('custom_mcp_servers')}
            tags={customTags}
            selectedItems={customSelectedItems}
            availableItems={customVisibleItems}
            isExpanded={expandedSections.has('custom')}
            isLoading={mcpServersLoading}
            loadingLabel={t('loading_mcp_servers')}
            onToggleExpand={handleToggleSection}
            onToggleItem={handleCustomMcpToggle}
            onRemoveItem={(serverId) => handleCustomMcpToggle(serverId, false)}
          />
        ) : null}
      </div>
    </div>
  )
}
