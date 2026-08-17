import { useCallback, useState } from 'react'
import {
  GroupFormFields,
  mapGroupFormToPayload,
} from '../../helpers/groups/groupForm.helpers'
import { removeEmptyValues } from '../../helpers/utils'
import {
  getApiErrorDetails,
  getApiErrorResourceId,
  getApiErrorStatus,
  getConflictErrorToast,
} from '../../helpers/api'
import { useTranslation } from 'react-i18next'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useIamApi } from '../../hooks/api/iam'
import { useFormContext, useFormState } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import GroupAddMembersDialog from './GroupAddMembersDialog'
import { useGroupData } from '../../context/Group.provider'
import { makeCall } from '../../helpers/api'
import { GroupUserTypes } from '../../models/Groups.model'
import { usePermissions } from '../../context/PermissionsProvider'
import styles from './GroupPageActions.module.scss'
import { useEntraIdGroupsSync } from '../../hooks/useEntraIdGroupsSync'

interface Props {
  activeTab: string | undefined
  managerPermissions?: boolean
}

import { groupDetailPath } from '../../constants/paths'
const GroupPageActions = (props: Props) => {
  const { activeTab, managerPermissions = false } = props
  const { t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { createGroup, updateGroup } = useIamApi()
  const { handleSubmit, reset, control } = useFormContext<GroupFormFields>()
  const { isDirty, isValid, dirtyFields } = useFormState({ control })
  const accessControlsDirty = !!dirtyFields.accessControls
  const canSave =
    isValid && (isDirty || accessControlsDirty) && managerPermissions
  const canDiscard = (isDirty || accessControlsDirty) && managerPermissions
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const { syncUserAccessControls, templates } = usePermissions()
  const { isEntraIdGroupsSyncEnabled } = useEntraIdGroupsSync()
  const canAddMembers = managerPermissions && !isEntraIdGroupsSyncEnabled

  const { group, syncGroup, groupType } = useGroupData()
  const [isMembersDialogOpened, setIsMembersDialogOpened] = useState(false)

  const submitCreateGroup = useCallback(
    async (data: GroupFormFields) => {
      try {
        const templateId = templates[0]?.id
        const usesTemplates =
          data.oeTemplates.length > 0 || data.dcpTemplates.length > 0
        if (usesTemplates && !templateId) {
          showError(t('usersAndGroups.groups.toasts.createGroup.error'))
          return
        }
        const payload = mapGroupFormToPayload(data, templateId)
        const filteredData = removeEmptyValues(payload)
        const newGroupId = await makeCall(
          () => createGroup(filteredData, groupType),
          blockPanel
        )
        showSuccess(t('usersAndGroups.groups.toasts.createGroup.success'))
        navigate(groupDetailPath(newGroupId), {
          replace: true,
        })
      } catch (e: unknown) {
        if (getApiErrorStatus(e) === 409) {
          const { title, detail } = getConflictErrorToast(
            e,
            t('usersAndGroups.groups.toasts.createGroup.conflictError', {
              name: data.id ?? getApiErrorResourceId(e) ?? '',
            })
          )
          showError(title, detail)
          return
        }
        showError(
          t('usersAndGroups.groups.toasts.createGroup.error'),
          getApiErrorDetails(e)
        )
      }
    },
    [
      templates,
      createGroup,
      groupType,
      blockPanel,
      navigate,
      t,
      showSuccess,
      showError,
    ]
  )

  const submitEditGroup = useCallback(
    async (data: GroupFormFields) => {
      if (!group) return

      // Hotfix COP-3557
      if (groupType === GroupUserTypes.CUSTOMER && group?.templates?.length > 0)
        return

      try {
        const templateId = templates[0]?.id
        const usesTemplates =
          data.oeTemplates.length > 0 || data.dcpTemplates.length > 0
        if (usesTemplates && !templateId) {
          showError(t('usersAndGroups.groups.toasts.editGroup.error'))
          return
        }
        const payload = mapGroupFormToPayload(data, templateId, group)
        const filteredData = removeEmptyValues(payload)
        await makeCall(
          () => updateGroup(filteredData, group.id, groupType),
          blockPanel
        )
        showSuccess(t('usersAndGroups.groups.toasts.editGroup.success'))
        await makeCall(syncGroup, blockPanel)
        await makeCall(syncUserAccessControls, blockPanel)
        reset({
          ...data,
          accessControls: data.accessControls ?? [],
        })
      } catch (e: unknown) {
        console.error(e)
        showError(
          t('usersAndGroups.groups.toasts.editGroup.error'),
          getApiErrorDetails(e)
        )
      }
    },
    [
      group,
      templates,
      groupType,
      updateGroup,
      blockPanel,
      syncGroup,
      syncUserAccessControls,
      reset,
      t,
      showSuccess,
      showError,
    ]
  )

  return (
    <>
      {activeTab === 'details' ? (
        <>
          <SecondaryButton
            className={styles.discardButton}
            disabled={!canDiscard}
            onClick={() => reset()}
          >
            {t('global.discard')}
          </SecondaryButton>
          <PrimaryButton
            disabled={!canSave}
            onClick={handleSubmit(group ? submitEditGroup : submitCreateGroup)}
          >
            {t('global.save')}
          </PrimaryButton>
        </>
      ) : (
        <>
          <PrimaryButton
            disabled={!canAddMembers}
            onClick={() => setIsMembersDialogOpened(true)}
          >
            {t('usersAndGroups.groups.buttons.addMembers')}
          </PrimaryButton>
          <GroupAddMembersDialog
            visible={isMembersDialogOpened}
            groupId={group?.id}
            onHide={() => setIsMembersDialogOpened(false)}
          />
        </>
      )}
    </>
  )
}

export default GroupPageActions
