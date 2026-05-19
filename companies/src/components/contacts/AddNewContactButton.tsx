import React from 'react'
import { SplitButton } from 'primereact/splitbutton'
import { Button } from 'primereact/button'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'

interface AddNewContactButtonProps {
  addNewContactHandle: () => void
  addExistingContactHandle: () => void
  addExistingContactLabel: string
  addNewContactLabel: string
  managerPermissions?: boolean
}

export const AddNewContactButton = (props: AddNewContactButtonProps) => {
  const { hasPermission } = usePermissions()
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const {
    addNewContactHandle,
    addExistingContactHandle,
    addExistingContactLabel,
    addNewContactLabel,
    managerPermissions = true,
  } = props
  const items = [
    {
      label: addNewContactLabel,
      command: addNewContactHandle,
    },
    {
      label: addExistingContactLabel,
      command: addExistingContactHandle,
    },
  ]

  return canManageCustomers ? (
    <SplitButton
      disabled={!managerPermissions}
      label={addExistingContactLabel}
      model={items}
      onClick={addExistingContactHandle}
    />
  ) : (
    <Button
      disabled={!managerPermissions}
      label={addExistingContactLabel}
      onClick={addExistingContactHandle}
    />
  )
}
