import React, { useCallback, useState } from 'react'
import ConfirmBox from '../ConfirmBox'
import { ApprovalGroup, LegalEntity } from '../../models/LegalEntity'
import { useTranslation } from 'react-i18next'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useRefresh } from '../../context/RefreshValuesProvider'
import TableActions from '../shared/TableActions'
import { useToast } from '../../context/ToastProvider'

interface ApprovalGroupTableActionProps {
  approvalGroup: ApprovalGroup
  legalEntity: Partial<LegalEntity>
  managerPermissions?: boolean
}

export const ApprovalGroupTableAction = (
  props: ApprovalGroupTableActionProps
) => {
  const { approvalGroup, legalEntity, managerPermissions = true } = props
  const { i18n, t } = useTranslation()
  const [dialogVisible, setDialogVisible] = useState(false)
  const { removeApprovalGroupContact } = useCustomerManagementApi()
  const { setRefreshValue } = useRefresh()
  const { showSuccess, showError } = useToast()

  const handleDelete = useCallback(
    async (contactAssignmentId: string) => {
      try {
        await removeApprovalGroupContact(legalEntity, [contactAssignmentId])
        setDialogVisible(false)
        setRefreshValue()
        showSuccess(t('companies.approvalGroup.toast.delete.success'))
      } catch (e: any) {
        showError(
          t('companies.toasts.errorDelete'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      }
    },
    [i18n.language, approvalGroup, legalEntity.id]
  )
  return (
    <div className={'flex justify-content-end'}>
      <TableActions
        managerPermission={managerPermissions}
        onDelete={() => setDialogVisible(true)}
      />
      <ConfirmBox
        key="delete-confirm-box"
        message={t('companies.approvalGroup.delete.message')}
        title={t('companies.approvalGroup.delete.title')}
        onReject={() => setDialogVisible(false)}
        visible={dialogVisible}
        onAccept={() => handleDelete(approvalGroup.id)}
      />
    </div>
  )
}
