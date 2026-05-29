import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import TokenCard from './TokenCard'
import { BasePage } from '../shared/BasePage'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Token } from '../../types/Token'
import { useTokens } from '../../hooks/useTokens'
import { AppState } from '../../types/common'

interface TokensPageProps {
  appState?: AppState
}

const TokensPage: React.FC<TokensPageProps> = ({
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
    contentLanguage: 'en',
  },
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    tokens,
    loading,
    error,
    removeToken,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  } = useTokens(appState)

  const handleConfigure = useCallback(
    (token: Token) => {
      navigate(`/tokens/${token.id}/edit`)
    },
    [navigate]
  )

  const handleAddNewToken = useCallback(() => {
    navigate('/tokens/add')
  }, [navigate])

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('tokens')}
      addButtonLabel={t('add_new_token')}
      onAdd={handleAddNewToken}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_token')}
      deleteConfirmMessage={t('delete_token_confirmation')}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="tokens"
    >
      {tokens.length === 0 ? (
        <div className="tokens-empty-state">
          <p>{t('no_tokens')}</p>
        </div>
      ) : (
        <div className="agents-grid">
          {tokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onConfigure={handleConfigure}
              onRemove={removeToken}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        visible={forceDeleteConfirmVisible}
        title={t('force_delete_token')}
        message={t('force_delete_token_message')}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete')}
        severity="warning"
      />
    </BasePage>
  )
}

export default TokensPage
