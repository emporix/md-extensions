import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { McpTool, ProjectCloudFunction } from '../../types/Mcp'
import { IamScope } from '../../services/iamScopesService'
import { McpToolCard } from './McpToolCard'

interface McpToolsEditorProps {
  tools: McpTool[]
  isCreating: boolean
  functions: ProjectCloudFunction[]
  functionsLoading: boolean
  functionsLoadError?: string | null
  featureDisabled: boolean
  scopes: IamScope[]
  scopesLoading: boolean
  scopesLoadError?: string | null
  onToolChange: (index: number, tool: McpTool) => void
  onAddTool: () => void
  onRemoveTool: (index: number) => void
}

export const McpToolsEditor = ({
  tools,
  isCreating,
  functions,
  functionsLoading,
  functionsLoadError,
  featureDisabled,
  scopes,
  scopesLoading,
  scopesLoadError,
  onToolChange,
  onAddTool,
  onRemoveTool,
}: McpToolsEditorProps) => {
  const { t } = useTranslation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(() =>
    isCreating && tools.length > 0 ? 0 : null
  )

  useEffect(() => {
    if (tools.length === 0) {
      setExpandedIndex(null)
      return
    }

    setExpandedIndex((current) => {
      if (current === null) {
        return null
      }
      if (current >= tools.length) {
        return tools.length - 1
      }
      return current
    })
  }, [tools.length])

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex((current) => (current === index ? null : index))
  }, [])

  const handleAddTool = useCallback(() => {
    onAddTool()
    setExpandedIndex(tools.length)
  }, [onAddTool, tools.length])

  const handleRemoveTool = useCallback(
    (index: number) => {
      onRemoveTool(index)
      setExpandedIndex((current) => {
        if (current === null) {
          return null
        }
        if (current === index) {
          return index > 0 ? index - 1 : 0
        }
        if (current > index) {
          return current - 1
        }
        return current
      })
    },
    [onRemoveTool]
  )

  if (tools.length === 0) {
    return (
      <div className="mcp-detail-tools-empty-state">
        <p>{t('dynamic_mcp_no_tools')}</p>
        <Button
          type="button"
          icon="pi pi-plus"
          className="p-button agent-detail-collaboration-add-btn agent-filter-dsl-add-icon-btn"
          aria-label={t('mcp_tool_add')}
          onClick={handleAddTool}
        />
      </div>
    )
  }

  return (
    <div className="mcp-detail-tools-editor">
      {tools.map((tool, index) => (
        <McpToolCard
          key={`mcp-tool-${index}`}
          tool={tool}
          index={index}
          expanded={expandedIndex === index}
          canRemove={tools.length > 1}
          functions={functions}
          functionsLoading={functionsLoading}
          functionsLoadError={functionsLoadError}
          featureDisabled={featureDisabled}
          scopes={scopes}
          scopesLoading={scopesLoading}
          scopesLoadError={scopesLoadError}
          onToggleExpand={() => handleToggleExpand(index)}
          onRemove={() => handleRemoveTool(index)}
          onChange={(updatedTool) => onToolChange(index, updatedTool)}
        />
      ))}

      <Button
        type="button"
        icon="pi pi-plus"
        className="p-button agent-detail-collaboration-add-btn agent-filter-dsl-add-icon-btn"
        aria-label={t('mcp_tool_add')}
        onClick={handleAddTool}
      />
    </div>
  )
}
