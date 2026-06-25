import { useCallback, useState } from 'react'
import {
  GroupFormFields,
  mapGroupFormToPayload,
} from '../../helpers/groups/groupForm.helpers'
import { removeEmptyValues } from '../../helpers/utils'
import { getApiErrorDetails, getApiErrorStatus } from '../../helpers/api'
import { useTranslation } from 'react-i18next'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useIamApi } from '../../hooks/api/iam'
import { useFormContext } from 'react-hook-form'
import { useToast } from '@emporix/component-library'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { Button } from 'primereact/button'
import GroupAddMembersDialog from './GroupAddMembersDialog'
import { useGroupData } from '../../context/Group.provider'
import { makeCall } from '../../helpers/api'
import { GroupUserTypes } from '../../models/Groups.model'
import { usePermissions } from '../../context/PermissionsProvider'

interface Props {
  activeTab: string | undefined
  managerPermissions?: boolean
}

import { groupDetailPath } from '../../constants/paths'
const GroupPageActions = (props: Props) => {
  const { activeTab, managerPermissions = false } = props
  const { i18n, t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { createGroup, updateGroup } = useIamApi()
  const { handleSubmit, formState, reset } = useFormContext<GroupFormFields>()
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const { syncUserAccessControls, templates } = usePermissions()

  const { group, syncGroup, groupType } = useGroupData()
  const [isMembersDialogOpened, setIsMembersDialogOpened] = useState(false)

  const submitCreateGroup = useCallback(
    async (data: GroupFormFields) => {
      try {
        const templateId = templates[0]?.id
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
          showError(
            t('usersAndGroups.groups.toasts.createGroup.error'),
            t('usersAndGroups.groups.toasts.createGroup.conflictError', {
              name: getApiErrorDetails(e),
            })
          )
        } else {
          showError(
            t('usersAndGroups.groups.toasts.createGroup.error'),
            getApiErrorDetails(e)
          )
        }
      }
    },
    [i18n, templates]
  )

  const submitEditGroup = useCallback(
    async (data: GroupFormFields) => {
      if (!group) return

      // Hotfix COP-3557
      if (groupType === GroupUserTypes.CUSTOMER && group?.templates?.length > 0)
        return

      try {
        const templateId = templates[0]?.id
        const payload = mapGroupFormToPayload(data, templateId, group)
        const filteredData = removeEmptyValues(payload)
        await makeCall(
          () => updateGroup(filteredData, group.id, groupType),
          blockPanel
        )
        showSuccess(t('usersAndGroups.groups.toasts.editGroup.success'))
        await makeCall(syncGroup, blockPanel)
        await makeCall(syncUserAccessControls, blockPanel)
      } catch (e: unknown) {
        console.error(e)
        showError(
          t('usersAndGroups.groups.toasts.editGroup.error'),
          getApiErrorDetails(e)
        )
      }
    },
    [i18n, group, templates, groupType]
  )

  return (
    <>
      {activeTab === 'details' ? (
        <>
          <Button
            className="p-button-secondary mr-2"
            label={t('global.discard')}
            disabled={!formState.isDirty || !managerPermissions}
            onClick={() => reset()}
          />
          <Button
            label={t('global.save')}
            disabled={
              !formState.isValid || !formState.isDirty || !managerPermissions
            }
            onClick={handleSubmit(group ? submitEditGroup : submitCreateGroup)}
          />
        </>
      ) : (
        <>
          <Button
            label={t('usersAndGroups.groups.buttons.addMembers')}
            disabled={!managerPermissions}
            onClick={() => setIsMembersDialogOpened(true)}
          />
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
