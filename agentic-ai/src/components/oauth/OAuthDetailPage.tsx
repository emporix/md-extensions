import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { OAuth } from '../../types/OAuth'
import { useAppState } from '../../contexts/AppStateContext'
import { getOAuths } from '../../services/oauthService'
import { createEmptyOAuth } from '../../utils/oauthHelpers'
import { useOAuthConfig } from '../../hooks/useOAuthConfig'
import { useAgentTokensCatalog } from '../../hooks/useAgentTokensCatalog'
import { OAuthGeneralSection } from './OAuthGeneralSection'
import { OAuthDetailSection } from './OAuthDetailSection'

const OAuthDetailPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { oauthId } = useParams<{ oauthId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [oauth, setOAuth] = useState<OAuth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { tokens, loading: tokensLoading } = useAgentTokensCatalog()

  useEffect(() => {
    if (isCreating) {
      setOAuth(createEmptyOAuth())
      setError(null)
      setLoading(false)
      return
    }

    if (!oauthId) {
      setError(t('oauth_not_found'))
      setOAuth(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const oauths = await getOAuths(appState)
        if (cancelled) return

        const foundOAuth = oauths.find((item) => item.id === oauthId)
        if (!foundOAuth) {
          setError(t('oauth_not_found'))
          setOAuth(null)
          return
        }

        setOAuth(foundOAuth)
      } catch {
        if (!cancelled) {
          setError(t('error_loading_oauth'))
          setOAuth(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [appState, isCreating, t, oauthId])

  const handleNavigateBack = useCallback(() => {
    navigate('/oauth')
  }, [navigate])

  const handleSaveSuccess = useCallback(() => {
    navigate('/oauth')
  }, [navigate])

  const {
    state,
    saving,
    updateField,
    handleSave,
    handleSaveAndConnect,
    isFormValid,
    isAuthorizationCode,
  } = useOAuthConfig({
    oauth,
    isCreating,
    onSave: handleSaveSuccess,
  })

  const oauthDisplayName = useMemo(() => {
    if (state.clientId.trim()) {
      return state.clientId
    }
    return isCreating ? t('new_oauth') : state.oauthId || t('new_oauth')
  }, [isCreating, state.clientId, state.oauthId, t])

  if (loading) {
    return (
      <div className="oauth-detail-page">
        <div className="oauth-detail-loading">
          <ProgressSpinner />
          <p>{t('loading_oauths')}</p>
        </div>
      </div>
    )
  }

  if (error || !oauth) {
    return (
      <div className="oauth-detail-page">
        <div className="oauth-detail-sticky-header">
          <div className="oauth-detail-header">
            <div className="oauth-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_oauths')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <span className="oauth-detail-title-label">{t('oauth')}</span>
            </div>
          </div>
        </div>
        <Message
          severity="error"
          text={error ?? t('oauth_not_found')}
          className="oauth-detail-error-message"
        />
      </div>
    )
  }

  return (
    <div className="oauth-detail-page">
      <div className="oauth-detail-sticky-header">
        <div className="oauth-detail-header">
          <div className="oauth-detail-header-main">
            <div className="oauth-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_oauths')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <h1 className="oauth-detail-title">
                <span className="oauth-detail-title-text">
                  <span className="oauth-detail-title-prefix">
                    {t('oauth')}{' '}
                  </span>
                  <span className="oauth-detail-title-name">
                    {oauthDisplayName}
                  </span>
                </span>
              </h1>
            </div>
            <p className="oauth-detail-subtitle">
              {t('oauth_detail_subtitle')}
            </p>
          </div>
          <div className="oauth-detail-header-right">
            {isAuthorizationCode && (
              <Button
                type="button"
                label={t('save_and_connect')}
                className="oauth-detail-save-btn"
                onClick={() => handleSaveAndConnect()}
                disabled={saving || !isFormValid || !state.enabled}
                loading={saving}
              />
            )}
            <Button
              type="button"
              label={t('save')}
              className="oauth-detail-save-btn"
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
              loading={saving}
            />
          </div>
        </div>
      </div>

      <div className="oauth-detail-content">
        <OAuthDetailSection titleKey="general">
          <OAuthGeneralSection
            oauthId={state.oauthId}
            tokenUrl={state.tokenUrl}
            authorizationUrl={state.authorizationUrl}
            clientId={state.clientId}
            grantType={state.grantType}
            scope={state.scope}
            clientSecretTokenId={state.clientSecretTokenId}
            codeChallengeMethod={state.codeChallengeMethod}
            status={state.status}
            enabled={state.enabled}
            isEditing={!isCreating && !!oauth.id}
            tokens={tokens}
            tokensLoading={tokensLoading}
            onFieldChange={updateField}
          />
        </OAuthDetailSection>
      </div>
    </div>
  )
}

export default OAuthDetailPage
