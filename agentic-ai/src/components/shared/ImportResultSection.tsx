import { useTranslation } from 'react-i18next'
import { ImportedItem, ImportResultSummary } from '../../types/Job'
import { ImportEntityDetails } from './ImportEntityDetails'
import { ContentSection } from './ContentSection'
import {
  getImportStateClassName,
  getImportStateLabel,
} from '../../utils/importDetails'

interface ImportResultSectionProps {
  importResult: ImportResultSummary
}

export const ImportResultSection = ({
  importResult,
}: ImportResultSectionProps) => {
  const { t } = useTranslation()

  const renderSummaryItem = (
    items: ImportedItem[],
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
            {t(labelKey)} ({items.length})
          </span>
        </div>
        <ul className="summary-list">
          {items.map((item, idx) => (
            <li key={item.id || idx} className="summary-list-item">
              <div className="summary-list-item-header">
                <span className="item-name">{item.name}</span>
                <span
                  className={`item-state ${getImportStateClassName(item.state)}`}
                >
                  {getImportStateLabel(t, item.state)}
                </span>
              </div>
              <span className="item-detail">
                {t('import_item_id', { id: item.id })}
              </span>
              <ImportEntityDetails details={item.details} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ContentSection icon="pi-download" title={t('import_result')}>
      {importResult.summary && (
        <div className="result-summary">
          <div className="summary-title">{t('summary')}</div>
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
