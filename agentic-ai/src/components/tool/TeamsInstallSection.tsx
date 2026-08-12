import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrosoft } from '@fortawesome/free-brands-svg-icons'
import { useAppState } from '../../contexts/AppStateContext'
import {
  getTeamsInstallationData,
  getTeamsInstallationStatus,
} from '../../services/toolsService'
import { useToast } from '../../contexts/ToastContext'
import {
  getTeamsAppPackageSuffix,
  getTeamsAppPackageUrl,
} from '../../utils/teamsAppPackageUrl'
import {
  clearTeamsInstallPending,
  readTeamsInstallPending,
  saveTeamsToolInstallDraft,
  saveTeamsInstallPending,
  TEAMS_INSTALL_POLL_INTERVAL_MS,
  TEAMS_INSTALL_POLL_TIMEOUT_MS,
} from '../../utils/teamsInstallCallback'

const TEAMS_APPS_URL = 'https://teams.microsoft.com/v2/'
const TEAMS_ADMIN_MANAGE_APPS_URL =
  'https://admin.teams.microsoft.com/policies/manage-apps'

interface TeamsInstallSectionProps {
  providerTenantId?: string
  toolId?: string
  toolName?: string
  toolType?: string
  toolPersisted?: boolean
  onProviderTenantIdChange?: (value: string) => void
  onInstallReady?: (toolId: string) => void
}

export const TeamsInstallSection: React.FC<TeamsInstallSectionProps> = ({
  providerTenantId: initialProviderTenantId = '',
  toolId = '',
  toolName = '',
  toolType = 'teams',
  toolPersisted = false,
  onProviderTenantIdChange,
  onInstallReady,
}) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showError, showSuccess } = useToast()
  const [teamsInstallLoading, setTeamsInstallLoading] = useState(false)
  const [graphConsentLoading, setGraphConsentLoading] = useState(false)
  const [installStateId, setInstallStateId] = useState<string | null>(null)
  const [providerTenantId, setProviderTenantId] = useState(
    initialProviderTenantId
  )
  const [waitingForInstall, setWaitingForInstall] = useState(false)
  const pollStartedAtRef = useRef<number | null>(null)
  const onInstallReadyRef = useRef(onInstallReady)

  useEffect(() => {
    onInstallReadyRef.current = onInstallReady
  }, [onInstallReady])

  useEffect(() => {
    setProviderTenantId(initialProviderTenantId)
  }, [initialProviderTenantId])

  const openUrlInNewTab = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stopInstallWait = useCallback(() => {
    clearTeamsInstallPending()
    setWaitingForInstall(false)
    pollStartedAtRef.current = null
  }, [])

  const handleInstallReady = useCallback(
    (readyToolId: string) => {
      stopInstallWait()
      showSuccess(t('teams_install_ready'))
      onInstallReadyRef.current?.(readyToolId)
    },
    [showSuccess, stopInstallWait, t]
  )

  const pollInstallStatus = useCallback(
    async (stateId: string, aadTenantId: string) => {
      try {
        const status = await getTeamsInstallationStatus(
          appState,
          stateId,
          aadTenantId
        )
        if (status.status === 'ready' && status.toolId?.trim()) {
          handleInstallReady(status.toolId.trim())
          return true
        }
        if (status.status === 'missing') {
          stopInstallWait()
          showError(t('teams_install_missing'))
          return true
        }
      } catch (error) {
        console.error('Failed to poll Teams installation status', error)
      }
      return false
    },
    [appState, handleInstallReady, showError, stopInstallWait, t]
  )

  useEffect(() => {
    const pending = readTeamsInstallPending()
    if (!pending) {
      return
    }
    setInstallStateId(pending.installStateId)
    setProviderTenantId(pending.providerTenantId)
    onProviderTenantIdChange?.(pending.providerTenantId)
    setWaitingForInstall(true)
    pollStartedAtRef.current = Date.now()
  }, [onProviderTenantIdChange])

  useEffect(() => {
    if (!waitingForInstall || !installStateId) {
      return
    }

    let cancelled = false
    const tick = async () => {
      if (cancelled) {
        return
      }
      const startedAt = pollStartedAtRef.current ?? Date.now()
      if (Date.now() - startedAt > TEAMS_INSTALL_POLL_TIMEOUT_MS) {
        stopInstallWait()
        showError(t('teams_install_poll_timeout'))
        return
      }
      const finished = await pollInstallStatus(installStateId, providerTenantId)
      if (finished) {
        return
      }
    }

    void tick()
    const intervalId = window.setInterval(() => {
      void tick()
    }, TEAMS_INSTALL_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [
    installStateId,
    pollInstallStatus,
    providerTenantId,
    showError,
    stopInstallWait,
    t,
    waitingForInstall,
  ])

  const handleTeamsInstallation = async () => {
    if (!providerTenantId.trim()) {
      showError(t('teams_connect_requires_consent'))
      return
    }

    try {
      setTeamsInstallLoading(true)
      const { id: stateId, appInstallUrl } = await getTeamsInstallationData(
        appState,
        providerTenantId,
        toolId,
        toolPersisted
      )
      setInstallStateId(stateId)

      if (!appInstallUrl) {
        showError(t('teams_install_catalog_missing'))
        return
      }

      saveTeamsInstallPending({
        installStateId: stateId,
        providerTenantId: providerTenantId.trim(),
      })
      pollStartedAtRef.current = Date.now()
      setWaitingForInstall(true)
      openUrlInNewTab(appInstallUrl)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_initiate_teams_installation')
      showError(`${t('error_teams_installation')}: ${errorMessage}`)
    } finally {
      setTeamsInstallLoading(false)
    }
  }

  const handleGraphAdminConsent = async () => {
    try {
      setGraphConsentLoading(true)
      const { id: stateId, adminConsentUrl } = await getTeamsInstallationData(
        appState,
        undefined,
        toolId,
        toolPersisted
      )
      setInstallStateId(stateId)

      saveTeamsToolInstallDraft({
        toolId: toolId.trim() || undefined,
        toolName: toolName.trim() || undefined,
        toolType: toolType.trim() || 'teams',
        tenantId: providerTenantId.trim() || undefined,
        installStateId: stateId,
      })

      if (!adminConsentUrl) {
        showError(t('teams_graph_consent_url_missing'))
        return
      }

      openUrlInNewTab(adminConsentUrl)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_initiate_teams_installation')
      showError(`${t('error_teams_installation')}: ${errorMessage}`)
    } finally {
      setGraphConsentLoading(false)
    }
  }

  const handleOpenTeamsApps = () => {
    openUrlInNewTab(TEAMS_APPS_URL)
  }

  const handleDownloadAppPackage = () => {
    const link = document.createElement('a')
    link.href = getTeamsAppPackageUrl()
    link.download = `EmporixTeamsBot.${getTeamsAppPackageSuffix()}.zip`
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenTeamsAdminCenter = () => {
    openUrlInNewTab(TEAMS_ADMIN_MANAGE_APPS_URL)
  }

  const renderTeamsButtonLabel = (label: string) => (
    <span className="tool-detail-slack-install-btn-content">
      <FontAwesomeIcon
        icon={faMicrosoft}
        className="tool-detail-slack-install-btn-icon"
        aria-hidden="true"
      />
      <span className="p-button-label">{label}</span>
    </span>
  )

  return (
    <div className="form-field tool-detail-slack-install">
      <label className="field-label">{t('install_emporix_teams_ai')}</label>
      <p className="tool-detail-slack-install-description">
        {t('teams_install_description')}
      </p>
      {providerTenantId.trim() ? (
        <Message
          severity="success"
          className="w-full"
          text={t('teams_consent_tenant_bound', {
            tenantId: providerTenantId.trim(),
          })}
        />
      ) : (
        <Message
          severity="info"
          className="w-full"
          text={t('teams_consent_then_connect_hint')}
        />
      )}
      {waitingForInstall ? (
        <Message
          severity="info"
          className="w-full"
          text={t('teams_install_waiting')}
        />
      ) : null}
      <p className="tool-detail-section-description">
        {t('install_status_pending')}
      </p>
      <ol className="tool-detail-teams-install-steps">
        <li>{t('teams_install_step_org_catalog')}</li>
        <li>{t('teams_install_step_graph_consent')}</li>
        <li>{t('teams_install_step_connect')}</li>
        <li>{t('teams_install_step_auto_tool')}</li>
      </ol>
      <div className="tool-detail-teams-install-actions">
        <div className="tool-detail-teams-install-action-group">
          <Button
            type="button"
            icon="pi pi-download"
            label={t('download_teams_app_package')}
            onClick={handleDownloadAppPackage}
            className="p-button-secondary tool-detail-slack-install-button"
            aria-label={t('download_teams_app_package')}
          />
          <Button
            type="button"
            icon="pi pi-external-link"
            label={t('open_teams_admin_center')}
            onClick={handleOpenTeamsAdminCenter}
            className="p-button-secondary tool-detail-slack-install-button"
            aria-label={t('open_teams_admin_center')}
          />
        </div>
        <Button
          type="button"
          icon="pi pi-shield"
          label={t('grant_teams_graph_consent')}
          onClick={handleGraphAdminConsent}
          loading={graphConsentLoading}
          disabled={graphConsentLoading}
          className="p-button-secondary tool-detail-slack-install-button"
          aria-label={t('grant_teams_graph_consent')}
        />
        <div className="tool-detail-teams-install-action-group">
          <Button
            type="button"
            onClick={handleTeamsInstallation}
            loading={teamsInstallLoading}
            disabled={
              teamsInstallLoading ||
              waitingForInstall ||
              !providerTenantId.trim()
            }
            className="p-button-secondary tool-detail-slack-install-button"
            aria-label={t('connect_teams')}
          >
            {renderTeamsButtonLabel(t('connect_teams'))}
          </Button>
          <Button
            type="button"
            icon="pi pi-external-link"
            label={t('open_teams_apps')}
            onClick={handleOpenTeamsApps}
            className="p-button-secondary tool-detail-slack-install-button"
            aria-label={t('open_teams_apps')}
          />
        </div>
      </div>
      {installStateId ? (
        <p className="tool-detail-section-description">
          {t('teams_install_state_id_hint', { id: installStateId })}
        </p>
      ) : null}
    </div>
  )
}
