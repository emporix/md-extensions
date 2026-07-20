import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PrimaryButton,
  SecondaryButton,
  Tabs,
  useToast,
} from '@emporix/component-library'
import { useUIBlocker } from '../context/UIBlcoker'
import { makeCall, getApiErrorDetails, getApiErrorStatus } from '../helpers/api'
import { useIamApi } from '../hooks/api/iam'
import { useParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import { User } from '../models/User.model'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useTabs } from '../hooks/useTabs'
import UserDetailsForm from '../components/user/UserDetailsForm'
import SectionBox from '../components/shared/SectionBox'
import HeaderSection from '../components/shared/HeaderSection'
import UserAccessForm from '../components/user/UserAccessForm'
import { removeEmptyValues } from '../helpers/utils'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import {
  createUserForm,
  mapUserFormToPayload,
  mapUserToUserForm,
  UserFormFields,
} from '../helpers/users/users.helpers'
import { listPath, userDetailPath } from '../constants/paths'
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import { AUDIT_LOG_FEATURE_TOGGLE } from '../configs/auditLog.config'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import styles from './UserPage.module.scss'

const BASE_TABS = ['details', 'access']

const UserPage = () => {
  const { t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { getUser, createUser, updateUser } = useIamApi()
  const methods = useForm<UserFormFields>({ defaultValues: createUserForm() })
  const { handleSubmit, formState, reset } = methods
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const toggles = useFeatureToggles()
  const tabIds = useMemo(
    () =>
      toggles.isToggleValid(AUDIT_LOG_FEATURE_TOGGLE)
        ? [...BASE_TABS, 'audit-log']
        : BASE_TABS,
    [toggles]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)
  const { syncUserAccessControls, hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const { userId } = useParams()
  const [user, setUser] = useState<User>()

  useEffect(() => {
    if (!userId) return
    void loadUser(userId)
  }, [userId])

  const loadUser = async (id: string) => {
    try {
      const loadedUser = await makeCall(() => getUser(id), blockPanel)
      reset(mapUserToUserForm(loadedUser))
      setUser(loadedUser)
    } catch (e: unknown) {
      console.error(e)
      navigate(listPath('users'))
      showError(
        t('usersAndGroups.users.toasts.fetchUser.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const submitCreateUser = async (data: UserFormFields) => {
    try {
      const filteredData = removeEmptyValues(data)
      const newUser = await makeCall(() => createUser(filteredData), blockPanel)
      showSuccess(t('usersAndGroups.users.toasts.createUser.success'))
      navigate(userDetailPath(newUser), { replace: true })
    } catch (e: unknown) {
      if (getApiErrorStatus(e) === 409) {
        showError(t('usersAndGroups.users.toasts.createUser.conflictError'))
        return
      }
      showError(
        t('usersAndGroups.users.toasts.createUser.generalError'),
        getApiErrorDetails(e)
      )
    }
  }

  const submitEditUser = async (data: UserFormFields) => {
    if (!user) return
    try {
      const payload = mapUserFormToPayload(data, user)
      await makeCall(() => updateUser(user.id, payload), blockPanel)
      await makeCall(syncUserAccessControls, blockPanel)
      showSuccess(t('usersAndGroups.users.toasts.editUser.success'))
      reset(data)
    } catch (e: unknown) {
      showError(
        t('usersAndGroups.users.toasts.editUser.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const subtitle = useMemo(() => {
    const firstName = user?.firstName ?? ''
    const lastName = user?.lastName ?? ''
    return `${firstName} ${lastName}`.trim()
  }, [user])

  const tabs = useMemo(
    () => [
      {
        id: 'details',
        label: t('usersAndGroups.users.tabs.details'),
        content: (
          <SectionBox>
            <UserDetailsForm />
          </SectionBox>
        ),
      },
      {
        id: 'access',
        label: t('usersAndGroups.users.tabs.access'),
        content: (
          <SectionBox>
            <UserAccessForm />
          </SectionBox>
        ),
      },
      ...(toggles.isToggleValid(AUDIT_LOG_FEATURE_TOGGLE)
        ? [
            {
              id: 'audit-log',
              label: t('auditLog.entityChangelog.tab'),
              disabled: !userId,
              content: userId ? (
                <EntityChangelogTab
                  entity="employee"
                  entityId={userId}
                  isActive={activeTab === 'audit-log'}
                />
              ) : null,
            },
          ]
        : []),
    ],
    [activeTab, t, toggles, userId]
  )

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('usersAndGroups.users.singular')}
        subtitle={userId ? subtitle : undefined}
        backTo={() => navigate(listPath('users'))}
        moduleActions={
          <div className={styles.headerActions}>
            <SecondaryButton
              className={styles.discardButton}
              disabled={!formState.isDirty || !canManage}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!formState.isValid || !formState.isDirty || !canManage}
              onClick={handleSubmit(user ? submitEditUser : submitCreateUser)}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? 'details'}
        onTabChange={onTabChange}
      />
    </FormProvider>
  )
}

export default UserPage
