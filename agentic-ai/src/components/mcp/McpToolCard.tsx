import { useTranslation } from 'react-i18next'
import { InputSwitch } from 'primereact/inputswitch'
import { McpTool, ProjectCloudFunction } from '../../types/Mcp'
import { IamScope } from '../../services/iamScopesService'
import { McpToolForm } from './McpToolForm'

interface McpToolCardProps {
  tool: McpTool
  index: number
  expanded: boolean
  canRemove: boolean
  functions: ProjectCloudFunction[]
  functionsLoading: boolean
  functionsLoadError?: string | null
  featureDisabled: boolean
  scopes: IamScope[]
  scopesLoading: boolean
  scopesLoadError?: string | null
  onToggleExpand: () => void
  onRemove: () => void
  onChange: (tool: McpTool) => void
}

export const McpToolCard = ({
  tool,
  index,
  expanded,
  canRemove,
  functions,
  functionsLoading,
  functionsLoadError,
  featureDisabled,
  scopes,
  scopesLoading,
  scopesLoadError,
  onToggleExpand,
  onRemove,
  onChange,
}: McpToolCardProps) => {
  const { t } = useTranslation()

  const title =
    tool.name.trim() || t('mcp_tool_unnamed', { index: index + 1 })
  const description = tool.description?.trim()

  return (
    <div
      className={`mcp-detail-tool-card${expanded ? '' : ' mcp-detail-tool-card--collapsed'}`}
    >
      <div className="mcp-detail-tool-card-header">
        <div className="mcp-detail-tool-card-header-main">
          <InputSwitch
            checked={tool.enabled !== false}
            onChange={(event) => onChange({ ...tool, enabled: event.value })}
          />
          <h3 className="mcp-detail-tool-card-title">{title}</h3>
          {description ? (
            <span className="mcp-detail-tool-card-description">{description}</span>
          ) : null}
        </div>
        <div className="mcp-server-actions">
          <button
            type="button"
            className="mcp-server-edit-btn"
            aria-label={expanded ? t('mcp_tool_collapse') : t('edit')}
            onClick={onToggleExpand}
          >
            <i className="pi pi-pencil" />
          </button>
          <button
            type="button"
            className="mcp-server-delete-btn"
            aria-label={t('mcp_tool_remove')}
            disabled={!canRemove}
            title={!canRemove ? t('mcp_tool_remove_last_disabled') : undefined}
            onClick={onRemove}
          >
            <i className="pi pi-trash" />
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="mcp-detail-tool-card-divider" />
          <McpToolForm
            tool={tool}
            functions={functions}
            functionsLoading={functionsLoading}
            functionsLoadError={functionsLoadError}
            featureDisabled={featureDisabled}
            scopes={scopes}
            scopesLoading={scopesLoading}
            scopesLoadError={scopesLoadError}
            onChange={onChange}
          />
        </>
      ) : null}
    </div>
  )
}
