import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import TableActions from '../shared/TableActions'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { getApiErrorDetails } from '../../helpers/api'
import { companyDetailPath } from '../../constants/paths'
import type { LegalEntity } from '../../models/LegalEntity.model'

type LegalEntityActionsProps = {
  readonly legalEntity: LegalEntity
  readonly managerPermissions?: boolean
}

/** Edit / delete (with confirm) row actions for a company or subsidiary. */
export const LegalEntityActions = ({
  legalEntity,
  managerPermissions = true,
}: LegalEntityActionsProps) => {
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
    } catch (e: unknown) {
      showError(t('companies.toasts.errorDelete'), getApiErrorDetails(e))
      console.error(e)
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [legalEntity, deleteLegalEntity])

  return (
    <TableActions
      managerPermission={managerPermissions}
      onEdit={() => navigate(companyDetailPath(legalEntity.id))}
      onDelete={handleDelete}
      deleteConfirm={{ pluralsPath: 'companies', entity: legalEntity }}
    />
  )
}

export default LegalEntityActions
