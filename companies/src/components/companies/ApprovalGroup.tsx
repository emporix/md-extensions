import React from 'react'
import { LegalEntity } from '../../models/LegalEntity'
import { SelectionValuesProvider } from '../../context/SelectionValuesProvider'
import { AddNewApprovalGroup } from './AddNewApprovalGroup'
import { ApprovalGroupTable } from './ApprovalGroupTable'
import { useTranslation } from 'react-i18next'
import { SectionTitle } from 'components/SectionBox'

interface ApprovalGroupProps {
  legalEntity: Partial<LegalEntity>
  managerPermissions?: boolean
}

const ApprovalGroupComponent = (props: ApprovalGroupProps) => {
  const { t } = useTranslation()

  const { legalEntity, managerPermissions } = props

  return (
    <>
      <SectionTitle
        className="mb-3"
        name={t('companies.edit.form.policies.approvalGroup.subtitle')}
        actions={
          legalEntity.id && (
            <AddNewApprovalGroup
              managerPermissions={managerPermissions}
              legalEntity={legalEntity}
            />
          )
        }
      />
      <ApprovalGroupTable
        managerPermissions={managerPermissions}
        legalEntity={legalEntity}
      />
    </>
  )
}

ApprovalGroupComponent.defaultProps = {
  managerPermissions: true,
}

export const ApprovalGroup = (props: ApprovalGroupProps) => {
  return (
    <SelectionValuesProvider>
      <ApprovalGroupComponent {...props} />
    </SelectionValuesProvider>
  )
}
