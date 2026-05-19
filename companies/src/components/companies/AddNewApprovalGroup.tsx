import React, { useCallback, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { ContactAssignmentList } from '../contacts/ContactAssignmentList'
import { Button } from 'primereact/button'
import { AddNewContactButton } from '../contacts/AddNewContactButton'
import {
  SelectionValuesProvider,
  useSelection,
} from '../../context/SelectionValuesProvider'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { LegalEntity } from '../../models/LegalEntity'
import { useRefresh } from '../../context/RefreshValuesProvider'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../context/ToastProvider'

interface AddNewApprovalGroupProps {
  legalEntity: Partial<LegalEntity>
  managerPermissions?: boolean
}

const AddNewApprovalGroupComponent = (props: AddNewApprovalGroupProps) => {
  const { legalEntity, managerPermissions = true } = props
  const { i18n, t } = useTranslation()
  const [dialogVisible, setDialogVisible] = useState(false)
  const { selection } = useSelection()
  const { setRefreshValue } = useRefresh()
  const { addApprovalGroupContact } = useCustomerManagementApi()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()

  const onSave = useCallback(async () => {
    try {
      await addApprovalGroupContact(props.legalEntity, selection)
      setDialogVisible(false)
      setRefreshValue()
      showSuccess(t('companies.approvalGroup.toast.add.success'), '')
    } catch (e: any) {
      showError(
        t('companies.toasts.errorSave'),
        e.response.data.details || e.response.data.message
      )
      console.error(e)
    }
  }, [i18n.language, selection, legalEntity])

  return (
    <>
      <AddNewContactButton
        managerPermissions={managerPermissions}
        addExistingContactLabel={t(
          'companies.approvalGroup.add.existing.label'
        )}
        addNewContactLabel={t('companies.approvalGroup.add.new.label')}
        addExistingContactHandle={() => {
          setDialogVisible(true)
        }}
        addNewContactHandle={() => {
          navigate(
            `/apps/management/companies/${props.legalEntity.id}/assignments/contact?approval=true`
          )
        }}
      />
      <Dialog
        header={t('Select new approval contact')}
        style={{ width: '60vw' }}
        visible={dialogVisible}
        onHide={() => {
          setDialogVisible(false)
        }}
      >
        {props.legalEntity.id && (
          <ContactAssignmentList
            managerPermissions={managerPermissions}
            legalEntity={props.legalEntity}
          />
        )}
        <Button
          disabled={!managerPermissions}
          className={'mt-2'}
          label={t('companies.approvalGroup.add.existing.label')}
          onClick={(event) => {
            event.preventDefault()
            onSave()
          }}
        />
      </Dialog>
    </>
  )
}

export const AddNewApprovalGroup = (props: AddNewApprovalGroupProps) => (
  <SelectionValuesProvider>
    <AddNewApprovalGroupComponent {...props} />
  </SelectionValuesProvider>
)
