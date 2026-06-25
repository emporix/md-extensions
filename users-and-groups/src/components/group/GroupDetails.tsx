import { useEffect } from 'react'
import GroupDetailsGeneralForm from './GroupDetailsGeneralForm'
import SectionBox from '../../components/shared/SectionBox'
import { useTranslation } from 'react-i18next'
import { useGroupData } from '../../context/Group.provider'
import { useFormContext } from 'react-hook-form'
import {
  GroupFormFields,
  mapGroupToGroupForm,
} from '../../helpers/groups/groupForm.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { Message } from 'primereact/message'
import AccessControlsTable from './AccessControlsTable'

const GroupDetails = () => {
  const { t } = useTranslation()
  const { reset } = useFormContext<GroupFormFields>()
  const { templates } = usePermissions()
  const { group, isPredefinedGroup } = useGroupData()

  useEffect(() => {
    if (!group || templates.length === 0) return
    reset(mapGroupToGroupForm(group))
  }, [group, templates])

  return (
    <>
      {isPredefinedGroup && (
        <Message
          className="mb-2 p-3"
          severity="info"
          text={t('usersAndGroups.groups.warnings.isPredefined')}
        />
      )}
      <SectionBox
        className="mb-6"
        name={t('usersAndGroups.groups.titles.general')}
      >
        <GroupDetailsGeneralForm groupId={group?.id}></GroupDetailsGeneralForm>
      </SectionBox>
      <AccessControlsTable />
    </>
  )
}

export default GroupDetails
