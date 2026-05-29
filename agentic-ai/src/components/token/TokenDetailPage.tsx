import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Token } from '../../types/Token'
import { AppState } from '../../types/common'
import { getTokens } from '../../services/tokensService'
import { createEmptyToken } from '../../utils/tokenHelpers'
import { useTokenConfig } from '../../hooks/useTokenConfig'
import { TokenGeneralSection } from './TokenGeneralSection'
import { TokenDetailSection } from './TokenDetailSection'

interface TokenDetailPageProps {
  appState: AppState
}

const TokenDetailPage: React.FC<TokenDetailPageProps> = ({ appState }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { tokenId } = useParams<{ tokenId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [token, setToken] = useState<Token | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isCreating) {
      setToken(createEmptyToken())
      setError(null)
      setLoading(false)
      return
    }

    if (!tokenId) {
      setError(t('token_not_found'))
      setToken(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const tokens = await getTokens(appState)
        if (cancelled) return

        const foundToken = tokens.find((item) => item.id === tokenId)
        if (!foundToken) {
          setError(t('token_not_found'))
          setToken(null)
          return
        }

        setToken(foundToken)
      } catch {
        if (!cancelled) {
          setError(t('error_loading_token'))
          setToken(null)
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
  }, [appState, isCreating, t, tokenId])

  const handleNavigateBack = useCallback(() => {
    navigate('/tokens')
  }, [navigate])

  const handleSaveSuccess = useCallback(() => {
    navigate('/tokens')
  }, [navigate])

  const { state, saving, updateField, handleSave, isFormValid } =
    useTokenConfig({
      token,
      isCreating,
      appState,
      onSave: handleSaveSuccess,
    })

  const tokenDisplayName = useMemo(() => {
    if (state.tokenName.trim()) {
      return state.tokenName
    }
    return isCreating ? t('new_token') : state.tokenId || t('new_token')
  }, [isCreating, state.tokenId, state.tokenName, t])

  if (loading) {
    return (
      <div className="token-detail-page">
        <div className="token-detail-loading">
          <ProgressSpinner />
          <p>{t('loading_tokens')}</p>
        </div>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="token-detail-page">
        <div className="token-detail-sticky-header">
          <div className="token-detail-header">
            <div className="token-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_tokens')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <span className="token-detail-title-label">{t('token')}</span>
            </div>
          </div>
        </div>
        <Message
          severity="error"
          text={error ?? t('token_not_found')}
          className="token-detail-error-message"
        />
      </div>
    )
  }

  return (
    <div className="token-detail-page">
      <div className="token-detail-sticky-header">
        <div className="token-detail-header">
          <div className="token-detail-header-main">
            <div className="token-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_tokens')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <h1 className="token-detail-title">
                <span className="token-detail-title-text">
                  <span className="token-detail-title-prefix">
                    {t('token')}{' '}
                  </span>
                  <span className="token-detail-title-name">
                    {tokenDisplayName}
                  </span>
                </span>
              </h1>
            </div>
            <p className="token-detail-subtitle">
              {t('token_detail_subtitle')}
            </p>
          </div>
          <div className="token-detail-header-right">
            <Button
              type="button"
              label={t('save')}
              className="token-detail-save-btn"
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
              loading={saving}
            />
          </div>
        </div>
      </div>

      <div className="token-detail-content">
        <TokenDetailSection titleKey="general">
          <TokenGeneralSection
            tokenId={state.tokenId}
            tokenName={state.tokenName}
            tokenValue={state.tokenValue}
            isEditing={!isCreating && !!token.id}
            onFieldChange={updateField}
          />
        </TokenDetailSection>
      </div>
    </div>
  )
}

export default TokenDetailPage
