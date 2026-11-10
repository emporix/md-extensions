import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, PrimaryButton, useToast } from '@emporix/component-library'
import { ContactAssignmentList } from '../contacts/ContactAssignmentList'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { AddNewContactButton } from '../contacts/AddNewContactButton'
import {
  SelectionValuesProvider,
  useSelection,
} from '../contacts/SelectionValues.context'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useRefresh } from '../../context/RefreshValuesProvider'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { getApiErrorDetails } from '../../helpers/api'
import { contactAddPath } from '../../constants/paths'
import type {
  ContactAssignment,
  LegalEntity,
} from '../../models/LegalEntity.model'
import styles from './ApprovalGroup.module.scss'

type AddNewApprovalGroupProps = {
  readonly legalEntity: Partial<LegalEntity>
  readonly managerPermissions?: boolean
}

const AddNewApprovalGroupComponent = ({
  legalEntity,
  managerPermissions = true,
}: AddNewApprovalGroupProps) => {
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)
  const { i18n, t } = useTranslation()
  const [dialogVisible, setDialogVisible] = useState(false)
  const { selection } = useSelection()
  const { setRefreshValue } = useRefresh()
  const { addApprovalGroupContact } = useCustomerManagementApi()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()

  const onSave = useCallback(async () => {
    try {
      await addApprovalGroupContact(
        legalEntity,
        selection as ContactAssignment[]
      )
      setDialogVisible(false)
      setRefreshValue()
      showSuccess(t('companies.approvalGroup.toast.add.success'), '')
    } catch (e: unknown) {
      showError(t('companies.toasts.errorSave'), getApiErrorDetails(e))
      console.error(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, selection, legalEntity])

  return (
    <>
      <AddNewContactButton
        managerPermissions={managerPermissions}
        addExistingContactLabel={t(
          'companies.approvalGroup.add.existing.label'
        )}
        addNewContactLabel={t('companies.approvalGroup.add.new.label')}
        addExistingContactHandle={() => setDialogVisible(true)}
        addNewContactHandle={() =>
          navigate(contactAddPath(legalEntity.id ?? '', 'approval=true'))
        }
      />
      <Dialog
        data-testid="approval-group-add-dialog"
        header={t('companies.approvalGroup.add.dialogTitle')}
        className={styles.addDialog}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
      >
        {legalEntity.id && (
          <ContactAssignmentList
            managerPermissions={managerPermissions}
            customerViewPermission={canViewCustomers}
            legalEntity={legalEntity}
          />
        )}
        <PrimaryButton
          disabled={!managerPermissions}
          className={styles.addDialogSave}
          onClick={(event) => {
            event.preventDefault()
            void onSave()
          }}
        >
          {t('companies.approvalGroup.add.existing.label')}
        </PrimaryButton>
      </Dialog>
    </>
  )
}

/** "Add existing" (dialog over the company's contacts) / "Add new" contact. */
export const AddNewApprovalGroup = (props: AddNewApprovalGroupProps) => (
  <SelectionValuesProvider>
    <AddNewApprovalGroupComponent {...props} />
  </SelectionValuesProvider>
)

export default AddNewApprovalGroup
