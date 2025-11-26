import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { ExportResult } from '../../types/Job'
import { ContentSection } from './ContentSection'

interface ExportDataItem {
  id: string
  name?: string | { en?: string }
}

interface ExportData {
  agents?: ExportDataItem[]
  tools?: ExportDataItem[]
  mcpServers?: ExportDataItem[]
}

interface ExportResultSectionProps {
  exportResult: ExportResult
}

export const ExportResultSection: React.FC<ExportResultSectionProps> = ({
  exportResult,
}) => {
  const { t } = useTranslation()

  const getExportItemName = (item: ExportDataItem): string => {
    if (typeof item.name === 'object' && item.name?.en) {
      return item.name.en
    }
    if (typeof item.name === 'string') {
      return item.name
    }
    return item.id
  }

  const decodedData = useMemo<ExportData | null>(() => {
    try {
      const decoded = atob(exportResult.data)
      return JSON.parse(decoded) as ExportData
    } catch (error) {
      console.error('Failed to decode export data:', error)
      return null
    }
  }, [exportResult.data])

  const handleDownload = () => {
    const exportData = {
      checksum: exportResult.checksum,
      data: exportResult.data,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `export-${exportResult.checksum.substring(0, 8)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderSummaryItem = (
    items: ExportDataItem[] | undefined,
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
              <span className="item-name">{getExportItemName(item)}</span>
              <span className="item-detail">ID: {item.id}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const downloadButton = (
    <Button
      label={t('download', 'Download')}
      icon="pi pi-download"
      onClick={handleDownload}
      className="ml-auto"
    />
  )

  return (
    <ContentSection
      icon="pi-upload"
      title={t('export_result', 'Export Result')}
      headerAction={downloadButton}
    >
      {decodedData && (
        <div className="result-summary">
          <div className="summary-title">{t('summary', 'Summary')}</div>
          <div className="summary-grid">
            {renderSummaryItem(decodedData.agents, 'pi-users', 'agents')}
            {renderSummaryItem(decodedData.tools, 'pi-wrench', 'tools')}
            {renderSummaryItem(
              decodedData.mcpServers,
              'pi-server',
              'mcp_servers'
            )}
          </div>
        </div>
      )}
    </ContentSection>
  )
}

export default ExportResultSection
