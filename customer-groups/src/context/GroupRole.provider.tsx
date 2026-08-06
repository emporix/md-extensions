import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { AccessControl } from '../models/Permissions.model'
import { usePermissions } from '../context/PermissionsProvider'
import {
  GroupFormFields,
  RoleType,
  ServiceType,
} from '../helpers/groups/groupForm.helpers'
import { useGroupData } from './Group.provider'

interface Props {
  children: ReactNode | ReactNode[]
}

interface ContextData {
  activeRoleType: RoleType
  setActiveRoleType: (type: RoleType) => void
  switchRoleType: (
    type: RoleType,
    currentState: Partial<GroupFormFields>
  ) => Partial<GroupFormFields> | undefined
  activeServiceType: ServiceType
  setActiveServiceType: (type: ServiceType) => void
  accessControlsByRole: AccessControl[]
}

const Context = createContext<ContextData>({
  activeRoleType: RoleType.STANDARD,
  activeServiceType: ServiceType.DCP,
  accessControlsByRole: [],
  setActiveRoleType: () => {
    // NOOP
  },
  switchRoleType: () => undefined,
  setActiveServiceType: () => {
    // NOOP
  },
})

export const useGroupRole = () => useContext(Context)

export const GroupRoleProvider = (props: Props) => {
  const {
    accessControlsForOe,
    accessControlsForVendor,
    accessControlsForEmployee,
    accessControlsForCustomer,
  } = usePermissions()
  const { groupType } = useGroupData()

  const [activeRoleType, setActiveRoleType] = useState<RoleType>(
    RoleType.STANDARD
  )
  const [activeServiceType, setActiveServiceType] = useState<ServiceType>(
    ServiceType.DCP
  )
  const [lastStandardState, setLastStandardState] =
    useState<Partial<GroupFormFields>>()
  const [lastTemplatesState, setTemplatesState] =
    useState<Partial<GroupFormFields>>()
  const [lastVendorState, setVendorState] = useState<Partial<GroupFormFields>>()

  const getStateForRoleType = (type: RoleType) => {
    if (type === RoleType.STANDARD) return lastStandardState
    if (type === RoleType.TEMPLATES) return lastTemplatesState
    if (type === RoleType.VENDOR) return lastVendorState
  }

  const saveStateForRoleType = (
    type: RoleType,
    state: Partial<GroupFormFields>
  ) => {
    if (type === RoleType.STANDARD) setLastStandardState(state)
    else if (type === RoleType.TEMPLATES) setTemplatesState(state)
    else if (type === RoleType.VENDOR) setVendorState(state)
  }

  const switchRoleType = (
    type: RoleType,
    currentState: Partial<GroupFormFields>
  ) => {
    saveStateForRoleType(activeRoleType, currentState)
    setActiveRoleType(type)
    return getStateForRoleType(type)
  }

  const accessControlsByRole = useMemo(() => {
    if (groupType === 'CUSTOMER') {
      return accessControlsForCustomer
    } else if (activeServiceType === ServiceType.OE) {
      return accessControlsForOe
    } else if (activeRoleType === RoleType.VENDOR) {
      return accessControlsForVendor
    } else if (activeRoleType === RoleType.STANDARD) {
      return accessControlsForEmployee
    } else if (activeRoleType === RoleType.TEMPLATES) {
      return accessControlsForEmployee
    } else {
      return accessControlsForEmployee
    }
  }, [
    activeRoleType,
    activeServiceType,
    groupType,
    accessControlsForCustomer,
    accessControlsForEmployee,
    accessControlsForOe,
    accessControlsForVendor,
  ])

  return (
    <Context.Provider
      value={{
        activeRoleType,
        activeServiceType,
        accessControlsByRole,
        setActiveRoleType,
        switchRoleType,
        setActiveServiceType,
      }}
    >
      {props.children}
    </Context.Provider>
  )
}
