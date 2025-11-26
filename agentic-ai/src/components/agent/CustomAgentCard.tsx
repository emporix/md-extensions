import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomAgent } from '../../types/Agent'
import { AgentCardBaseProps, AppState } from '../../types/common'
import { getLocalizedValue, iconMap } from '../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import AgentCard from './AgentCard'
import { exportAgents } from '../../services/agentService'
import { useToast } from '../../contexts/ToastContext'

interface CustomAgentCardProps extends AgentCardBaseProps {
  agent: CustomAgent
  appState: AppState
  onConfigure: (agent: CustomAgent) => void
  onRemove: (agentId: string) => void
}

const CustomAgentCard = memo(
  ({
    agent,
    appState,
    onToggleActive,
    onConfigure,
    onRemove,
  }: CustomAgentCardProps) => {
    const { t, i18n } = useTranslation()
    const { showSuccess, showError } = useToast()
    const [isExporting, setIsExporting] = useState(false)

    const agentName = getLocalizedValue(agent.name, i18n.language)
    const agentDescription = getLocalizedValue(agent.description, i18n.language)

    const handleViewLogs = () => {
      const url = `#/logs/sessions?agentId=${agent.id}`
      window.location.href = url
    }

    const getAgentIcon = () => {
      if (agent.icon && iconMap[agent.icon]) {
        return <FontAwesomeIcon icon={iconMap[agent.icon]} />
      }
      return <FontAwesomeIcon icon={faRobot} />
    }

    const handleExport = async () => {
      if (isExporting) return

      setIsExporting(true)
      try {
        const response = await exportAgents(appState, [agent.id])

        const exportData = {
          exportedAt: response.exportedAt,
          data: response.data,
          checksum: response.checksum,
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `agent-${agent.id}-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        showSuccess(
          t('agent_exported_successfully', 'Agent exported successfully')
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to export agent'
        showError(
          `${t('error_exporting_agent', 'Error exporting agent')}: ${errorMessage}`
        )
      } finally {
        setIsExporting(false)
      }
    }

    return (
      <AgentCard
        id={agent.id}
        name={agentName}
        description={agentDescription}
        icon={getAgentIcon()}
        tags={agent.tags}
        enabled={agent.enabled}
        onToggleActive={onToggleActive}
        onClick={() => onConfigure(agent)}
        actions={[
          {
            icon: 'pi pi-cog',
            label: t('configure'),
            onClick: () => onConfigure(agent),
            className: 'configure-button',
          },
          {
            icon: 'pi pi-bars',
            label: t('view_logs', 'Logs'),
            onClick: handleViewLogs,
            className: 'view-logs-button',
          },
          {
            icon: 'pi pi-upload',
            label: t('export', 'Export'),
            onClick: handleExport,
            disabled: isExporting,
            title: isExporting
              ? t('exporting', 'Exporting...')
              : t('export_agent', 'Export agent'),
            className: 'export-button',
          },
          {
            icon: 'pi pi-trash',
            label: t('remove', 'Remove'),
            onClick: () => onRemove(agent.id),
            disabled: agent.enabled,
            title: agent.enabled
              ? t('cannot_delete_active_agent', 'Cannot delete active agent')
              : t('remove_agent', 'Remove agent'),
            className: 'remove-button',
          },
        ]}
      />
    )
  }
)

export default CustomAgentCard
