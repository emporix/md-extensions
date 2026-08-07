import { useEffect, useRef } from 'react'
import GroupDetailsGeneralForm from './GroupDetailsGeneralForm'
import SectionBox from '../../components/shared/SectionBox'
import { useTranslation } from 'react-i18next'
import { Message } from '@emporix/component-library'
import { useGroupData } from '../../context/Group.provider'
import { useFormContext } from 'react-hook-form'
import {
  GroupFormFields,
  mapGroupToGroupForm,
} from '../../helpers/groups/groupForm.helpers'
import AccessControlsTable from './AccessControlsTable'
import styles from './GroupDetails.module.scss'

const GroupDetails = () => {
  const { t } = useTranslation()
  const {
    reset,
    trigger,
    formState: { isDirty },
  } = useFormContext<GroupFormFields>()
  const { group, isPredefinedGroup } = useGroupData()
  const initializedGroupKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!group) {
      initializedGroupKeyRef.current = null
      return
    }

    const groupKey = group.id || 'new'
    if (initializedGroupKeyRef.current === groupKey) {
      return
    }

    // Remount (e.g. tab switch): FormProvider kept dirty values and ref reset to
    // null. Keep edits only when we have not yet bound any group key — never
    // when navigating to a different group while dirty.
    if (isDirty && initializedGroupKeyRef.current === null) {
      initializedGroupKeyRef.current = groupKey
      return
    }

    initializedGroupKeyRef.current = groupKey
    reset(mapGroupToGroupForm(group))
    // Keep Save's isValid gate in sync after Controllers register.
    void trigger()
    // isDirty intentionally omitted from deps — read only as a remount guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [group, reset, trigger])

  return (
    <>
      {isPredefinedGroup && (
        <Message
          className={styles.predefinedWarning}
          severity="info"
          text={t('usersAndGroups.groups.warnings.isPredefined')}
        />
      )}
      <SectionBox
        className={styles.generalSection}
        name={t('usersAndGroups.groups.titles.general')}
      >
        <GroupDetailsGeneralForm groupId={group?.id}></GroupDetailsGeneralForm>
      </SectionBox>
      <AccessControlsTable />
    </>
  )
}

export default GroupDetails
