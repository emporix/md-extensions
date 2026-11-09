import { PrimaryButton, SplitButton } from '@emporix/component-library'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'

type AddNewContactButtonProps = {
  readonly addNewContactHandle: () => void
  readonly addExistingContactHandle: () => void
  readonly addExistingContactLabel: string
  readonly addNewContactLabel: string
  readonly managerPermissions?: boolean
}

/**
 * "Add existing" button with an "Add new" menu entry. Creating a new contact
 * needs CUSTOMERS_MANAGER; without it only "Add existing" is offered.
 */
export const AddNewContactButton = ({
  addNewContactHandle,
  addExistingContactHandle,
  addExistingContactLabel,
  addNewContactLabel,
  managerPermissions = true,
}: AddNewContactButtonProps) => {
  const { hasPermission } = usePermissions()
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const items = [
    { label: addNewContactLabel, command: addNewContactHandle },
    { label: addExistingContactLabel, command: addExistingContactHandle },
  ]

  return canManageCustomers ? (
    <SplitButton
      data-testid="add-contact-split-button"
      disabled={!managerPermissions}
      label={addExistingContactLabel}
      model={items}
      onClick={addExistingContactHandle}
    />
  ) : (
    <PrimaryButton
      data-testid="add-contact-button"
      disabled={!managerPermissions}
      onClick={addExistingContactHandle}
    >
      {addExistingContactLabel}
    </PrimaryButton>
  )
}

export default AddNewContactButton
