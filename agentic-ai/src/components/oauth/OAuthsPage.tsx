import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import OAuthCard from './OAuthCard'
import { BasePage } from '../shared/BasePage'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { OAuth } from '../../types/OAuth'
import { useOAuths } from '../../hooks/useOAuths'

const OAuthsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    oauths,
    loading,
    error,
    removeOAuth,
    toggleOAuthActive,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  } = useOAuths()

  const handleConfigure = useCallback(
    (oauth: OAuth) => {
      navigate(`/oauth/${oauth.id}/edit`)
    },
    [navigate]
  )

  const handleAddNewOAuth = useCallback(() => {
    navigate('/oauth/add')
  }, [navigate])

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('oauths')}
      addButtonLabel={t('add_new_oauth')}
      onAdd={handleAddNewOAuth}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_oauth')}
      deleteConfirmMessage={t('delete_oauth_confirmation')}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="oauths"
    >
      {oauths.length === 0 ? (
        <div className="oauths-empty-state">
          <p>{t('no_oauths')}</p>
        </div>
      ) : (
        <div className="agents-grid">
          {oauths.map((oauth) => (
            <OAuthCard
              key={oauth.id}
              oauth={oauth}
              onToggleActive={toggleOAuthActive}
              onConfigure={handleConfigure}
              onRemove={removeOAuth}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        visible={forceDeleteConfirmVisible}
        title={t('force_delete_oauth')}
        message={t('force_delete_oauth_message')}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete')}
        severity="warning"
      />

      <ConfirmDialog
        visible={forceToggleConfirmVisible}
        title={t('force_disable_oauth')}
        message={t('force_disable_oauth_message')}
        onConfirm={confirmForceToggle}
        onHide={hideForceToggleConfirm}
        confirmLabel={t('force_disable')}
        severity="warning"
      />
    </BasePage>
  )
}

export default OAuthsPage
