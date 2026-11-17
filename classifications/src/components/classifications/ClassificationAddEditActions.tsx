import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { useUIBlocker } from '../../context/UIBlcoker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useClassificationData } from '../../context/Classification.provider'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useCategoryTreeRebuild } from '../../hooks/api/categoryTreeRebuild'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import {
  getApiErrorDetails,
  getApiErrorStatus,
  makeCall,
} from '../../helpers/api'
import { removeEmptyValues } from '../../helpers/utils'
import { EmployeeDomains } from '../../configs/accessControls'
import { classificationDetailPath } from '../../constants/paths'
import {
  ClassificationFormFields,
  mapFormToPayload,
} from '../../helpers/classificationForm.helpers'
import styles from './ClassificationAddEditActions.module.scss'

/** Ported from management-dashboard `modules/classifications/components/ClassificationAddEditActions`. */
const ClassificationAddEditActions = () => {
  const { t } = useTranslation()
  const { handleSubmit, formState, reset } =
    useFormContext<ClassificationFormFields>()
  const { classification, syncClassification } = useClassificationData()
  const { createCategory, updateCategory } = useCategoriesApi()
  const { rebuildForCategories } = useCategoryTreeRebuild()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError, showToast } = useToast()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  // The classification is saved by then, so a failed rebuild leaves only its
  // tree stale. One toast only: two shown at once replace each other.
  const rebuildAndNotify = async (categoryIds: string[], title: string) => {
    try {
      await rebuildForCategories(categoryIds)
      showSuccess(title)
    } catch (e) {
      console.error(e)
      showToast(title, t('categories.actions.rebuild.error'), 'warn')
    }
  }

  const handleCreate = async (data: ClassificationFormFields) => {
    try {
      const payload = removeEmptyValues(mapFormToPayload(data))
      const newClassificationId = await makeCall(
        () => createCategory(payload),
        blockPanel
      )
      await rebuildAndNotify(
        [newClassificationId],
        t('classifications.toasts.successCreateClassification')
      )
      navigate(classificationDetailPath(newClassificationId), {
        replace: true,
      })
    } catch (e) {
      console.error(e)
      showError(
        t('classifications.toasts.errorCreateClassification'),
        getApiErrorStatus(e) === 409
          ? t('classifications.toasts.errorConflict')
          : getApiErrorDetails(e)
      )
    }
  }

  const handleEdit = async (data: ClassificationFormFields) => {
    if (!classification) return
    try {
      const payload = mapFormToPayload(data, classification)
      await makeCall(
        () => updateCategory(removeEmptyValues(payload)),
        blockPanel
      )
      // Rebuild the classification's root, and after a move also the old one.
      const oldParentId = classification.parentId
      await rebuildAndNotify(
        [
          classification.id,
          ...(oldParentId && oldParentId !== (payload.parentId || undefined)
            ? [oldParentId]
            : []),
        ],
        t('classifications.toasts.successEditClassification')
      )
      reset(data)
      await syncClassification()
    } catch (e) {
      console.error(e)
      showError(
        t('classifications.toasts.errorEditClassification'),
        getApiErrorDetails(e)
      )
    }
  }

  return (
    <div className={styles.actions}>
      <SecondaryButton
        disabled={!formState.isDirty || !canManage}
        onClick={() => reset()}
        data-testid="classification-discard"
      >
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        disabled={!formState.isValid || !formState.isDirty || !canManage}
        onClick={() =>
          void handleSubmit(classification ? handleEdit : handleCreate)()
        }
        data-testid="classification-save"
      >
        {t('global.save')}
      </PrimaryButton>
    </div>
  )
}

export default ClassificationAddEditActions
