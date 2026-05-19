import React, { useCallback } from 'react'
import { LegalEntity } from '../../models/LegalEntity'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useTranslation } from 'react-i18next'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useToast } from '../../context/ToastProvider'
import TableActions from '../shared/TableActions'
import useCustomNavigate from '../../hooks/useCustomNavigate'

interface LegalEntityActionsProps {
  legalEntity: LegalEntity
  managerPermissions?: boolean
}

export const LegalEntityActions = (props: LegalEntityActionsProps) => {
  const { legalEntity, managerPermissions = true } = props
  const { deleteLegalEntity } = useCustomerManagementApi()
  const { setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()

  const handleDelete = useCallback(async () => {
    blockPanel(true)
    try {
      await deleteLegalEntity(legalEntity.id)
      setRefreshValue()
      showSuccess(t('companies.toast.delete.title'))
    } catch (e: any) {
      showError(
        t('companies.toasts.errorDelete'),
        e.response.data.details || e.response.data.message
      )
      console.error(e)
    } finally {
      blockPanel(false)
    }
  }, [legalEntity, deleteLegalEntity])

  return (
    <>
      <TableActions
        managerPermission={managerPermissions}
        onEdit={() => navigate(`/apps/management/companies/${legalEntity.id}`)}
        onDelete={handleDelete}
        deleteConfirm={{ pluralsPath: 'companies', entity: legalEntity }}
      />
    </>
  )
}
