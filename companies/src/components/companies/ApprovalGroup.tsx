import { useTranslation } from 'react-i18next'
import { SectionTitle } from '@emporix/component-library'
import { AddNewApprovalGroup } from './AddNewApprovalGroup'
import { ApprovalGroupTable } from './ApprovalGroupTable'
import { SelectionValuesProvider } from '../contacts/SelectionValues.context'
import type { LegalEntity } from '../../models/LegalEntity.model'
import styles from './ApprovalGroup.module.scss'

type ApprovalGroupProps = {
  readonly legalEntity: Partial<LegalEntity>
  readonly managerPermissions?: boolean
}

const ApprovalGroupComponent = ({
  legalEntity,
  managerPermissions = true,
}: ApprovalGroupProps) => {
  const { t } = useTranslation()

  return (
    <>
      <SectionTitle
        className={styles.title}
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

/** Policies tab: the company's approval group contacts. */
export const ApprovalGroup = (props: ApprovalGroupProps) => (
  <SelectionValuesProvider>
    <ApprovalGroupComponent {...props} />
  </SelectionValuesProvider>
)

export default ApprovalGroup
