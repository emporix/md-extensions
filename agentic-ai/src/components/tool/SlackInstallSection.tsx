import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { AppState } from '../../types/common'
import { getSlackInstallationData } from '../../services/toolsService'
import { useToast } from '../../contexts/ToastContext'
import slackIcon from '../../assets/slack_icon.svg'

interface SlackInstallSectionProps {
  appState: AppState
}

export const SlackInstallSection: React.FC<SlackInstallSectionProps> = ({
  appState,
}) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const [slackInstallLoading, setSlackInstallLoading] = useState(false)

  const handleSlackInstallation = async () => {
    try {
      setSlackInstallLoading(true)
      const { id: stateId, clientId } = await getSlackInstallationData(appState)
      const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=app_mentions:read,channels:history,channels:manage,channels:read,channels:write.invites,chat:write,groups:read,groups:write,users:read,users:read.email&user_scope=&state=${stateId}`
      window.location.href = slackOAuthUrl
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_initiate_slack_installation')
      showError(`${t('error_slack_installation')}: ${errorMessage}`)
    } finally {
      setSlackInstallLoading(false)
    }
  }

  return (
    <div className="form-field tool-detail-slack-install">
      <label className="field-label">{t('install_emporix_slack_ai')}</label>
      <p className="tool-detail-slack-install-description">
        {t('slack_install_description')}
      </p>
      <Button
        type="button"
        onClick={handleSlackInstallation}
        loading={slackInstallLoading}
        disabled={slackInstallLoading}
        className="p-button-secondary tool-detail-slack-install-button"
        aria-label={t('add_to_slack')}
      >
        <span className="tool-detail-slack-install-btn-content">
          <img
            src={slackIcon}
            alt=""
            className="tool-detail-slack-install-btn-icon"
            aria-hidden="true"
          />
          <span className="p-button-label">{t('add_to_slack')}</span>
        </span>
      </Button>
    </div>
  )
}
