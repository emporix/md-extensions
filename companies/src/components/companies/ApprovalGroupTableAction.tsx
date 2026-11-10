import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmBox, useToast } from '@emporix/component-library'
import TableActions from '../shared/TableActions'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { getApiErrorDetails } from '../../helpers/api'
import type { ApprovalGroup, LegalEntity } from '../../models/LegalEntity.model'
import styles from './ApprovalGroup.module.scss'

type ApprovalGroupTableActionProps = {
  readonly approvalGroup: ApprovalGroup
  readonly legalEntity: Partial<LegalEntity>
  readonly managerPermissions?: boolean
}

/** Removes one contact from the company's approval group, after a confirm. */
export const ApprovalGroupTableAction = ({
  approvalGroup,
  legalEntity,
  managerPermissions = true,
}: ApprovalGroupTableActionProps) => {
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
      } catch (e: unknown) {
        showError(t('companies.toasts.errorDelete'), getApiErrorDetails(e))
        console.error(e)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, approvalGroup, legalEntity.id]
  )

  return (
    <div className={styles.actionCell}>
      <TableActions
        managerPermission={managerPermissions}
        onDelete={() => setDialogVisible(true)}
      />
      <ConfirmBox
        key="delete-confirm-box"
        message={t('companies.approvalGroup.delete.message')}
        title={t('companies.approvalGroup.delete.title')}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
        onReject={() => setDialogVisible(false)}
        visible={dialogVisible}
        onAccept={() => handleDelete(approvalGroup.id)}
      />
    </div>
  )
}

export default ApprovalGroupTableAction
