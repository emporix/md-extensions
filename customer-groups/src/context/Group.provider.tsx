import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Group, GroupUserTypes, Template } from '../models/Groups.model'
import { makeCall, getApiErrorDetails } from '../helpers/api'
import { useIamApi } from '../hooks/api/iam'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useParams } from 'react-router'
import { useToast } from '@emporix/component-library'
import { User } from '../models/User.model'

import { listPath } from '../constants/paths'

interface Props {
  groupType?: GroupUserTypes
  children: ReactNode
}

interface ContextData {
  group: Group | undefined
  groupMembers: User[]
  groupType: GroupUserTypes
  isLoadingData: boolean
  syncGroup: () => Promise<void>
  syncMembers: (userType?: GroupUserTypes) => Promise<void>
  isPredefinedGroup: boolean
}

const Context = createContext<ContextData>({
  group: undefined,
  groupMembers: [],
  isLoadingData: false,
  groupType: GroupUserTypes.EMPLOYEE,
  syncGroup: async () => {
    // NOOP
  },
  syncMembers: async () => {
    // NOOP
  },
  isPredefinedGroup: false,
})

export const useGroupData = () => useContext(Context)

export const GroupDataProvider = (props: Props) => {
  const { groupType = GroupUserTypes.EMPLOYEE, children } = props
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { showError } = useToast()
  const { getGroup, getGroupUsers, getAllUsers, getAccessControlsTemplates } =
    useIamApi()

  const { groupId } = useParams()
  const [group, setGroup] = useState<Group>()
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const isCustomerGroup = groupType === GroupUserTypes.CUSTOMER
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    ;(async () => {
      if (!groupId) return
      try {
        const loadedGroup = await makeCall(
          () => getGroup(groupId),
          setIsLoadingData
        )
        if (cancelledRef.current) return
        if (isCustomerGroup && loadedGroup?.templates?.length > 0) {
          loadedGroup.accessControls =
            await getAccessControlsFromTemplates(loadedGroup)
        }
        if (cancelledRef.current) return
        setGroup(loadedGroup)
      } catch (e: unknown) {
        if (cancelledRef.current) return
        console.error(e)
        navigate(listPath())
        showError(
          t('usersAndGroups.users.toasts.fetchUser.error'),
          getApiErrorDetails(e)
        )
      }
    })()
    return () => {
      cancelledRef.current = true
    }
  }, [groupId])

  const syncGroup = async () => {
    if (!groupId) return
    try {
      const loadedGroup = await makeCall(
        () => getGroup(groupId),
        setIsLoadingData
      )
      if (isCustomerGroup && loadedGroup?.templates?.length > 0) {
        loadedGroup.accessControls =
          await getAccessControlsFromTemplates(loadedGroup)
      }
      setGroup(loadedGroup)
    } catch (e: unknown) {
      console.error(e)
      navigate(listPath())
      showError(
        t('usersAndGroups.users.toasts.fetchUser.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const getAccessControlsFromTemplates = async (group: Group) => {
    let accessControls = group.accessControls ? [...group.accessControls] : []
    const templateId = group.templates[0]
    const templates = await makeCall(
      () => getAccessControlsTemplates(),
      setIsLoadingData
    )
    const matchingTemplate = (templates as unknown as Template[]).find(
      (template) => template.id === templateId
    )
    if (matchingTemplate?.accessControls) {
      const existingAccessControls = Array.isArray(accessControls)
        ? accessControls
        : []
      accessControls = [
        ...new Set([
          ...existingAccessControls,
          ...matchingTemplate.accessControls,
        ]),
      ]
    }
    return accessControls
  }

  const syncMembers = async (userType = GroupUserTypes.EMPLOYEE) => {
    if (!group) return
    try {
      const { values: allUsers } = await makeCall(
        () => getAllUsers(userType),
        setIsLoadingData
      )
      const groupUsers = await makeCall(
        () => getGroupUsers(group?.id),
        setIsLoadingData
      )
      const filteredUsers = allUsers.filter((u) => {
        return groupUsers.some((gu) => gu.userId === u.id)
      })
      setGroupMembers(filteredUsers)
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.groups.toasts.fetchMembers.error'),
        getApiErrorDetails(e)
      )
    }
  }

  // Hotfix COP-3557
  const isPredefinedGroup = useMemo(() => {
    const containsKeyword = (name: Record<string, string>) => {
      const keywords = ['admin', 'buyer', 'contact', 'requester', 'customers']
      const reservedRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i')
      return Object.values(name).some((val) =>
        val ? reservedRegex.test(val.trim().toLowerCase()) : false
      )
    }
    const isNamePredefined = containsKeyword(group?.name || {})
    const isCustomerGroup = group?.userType === GroupUserTypes.CUSTOMER
    return (
      (isCustomerGroup && group.templates?.length > 0) ||
      (isCustomerGroup && isNamePredefined)
    )
  }, [group])

  return (
    <Context.Provider
      value={{
        group,
        groupMembers,
        isLoadingData,
        groupType,
        syncGroup,
        syncMembers,
        isPredefinedGroup,
      }}
    >
      {children}
    </Context.Provider>
  )
}
