import React from 'react'
import { useTranslation } from 'react-i18next'
import { ImportResultSummary } from '../../types/Job'
import { ContentSection } from './ContentSection'

interface ImportResultSectionProps {
  importResult: ImportResultSummary
}

export const ImportResultSection: React.FC<ImportResultSectionProps> = ({
  importResult,
}) => {
  const { t } = useTranslation()

  const renderSummaryItem = (
    items: Array<{ id: string; name: string; state: string }>,
    icon: string,
    labelKey: string
  ) => {
    if (!items || items.length === 0) {
      return null
    }

    return (
      <div className="summary-item">
        <div className="summary-item-header">
          <i className={`pi ${icon}`} />
          <span>
            {t(labelKey, labelKey)} ({items.length})
          </span>
        </div>
        <ul className="summary-list">
          {items.map((item, idx) => (
            <li key={idx} className="summary-list-item">
              <span className="item-name">{item.name}</span>
              <span className="item-detail">ID: {item.id}</span>
              <span
                className={`item-state state-${item.state.toLowerCase().replace('_', '-')}`}
              >
                {item.state}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ContentSection
      icon="pi-download"
      title={t('import_result', 'Import Result')}
    >
      {importResult.summary && (
        <div className="result-summary">
          <div className="summary-title">{t('summary', 'Summary')}</div>
          <div className="summary-grid">
            {renderSummaryItem(
              importResult.summary.agents,
              'pi-users',
              'agents'
            )}
            {renderSummaryItem(
              importResult.summary.tools,
              'pi-wrench',
              'tools'
            )}
            {renderSummaryItem(
              importResult.summary.mcpServers,
              'pi-server',
              'mcp_servers'
            )}
          </div>
        </div>
      )}
    </ContentSection>
  )
}

export default ImportResultSection
