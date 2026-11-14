import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { useUIBlocker } from '../../context/UIBlcoker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useCategoryData } from '../../context/Category.provider'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useCategoryTreeRebuild } from '../../hooks/api/categoryTreeRebuild'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import { EmployeeDomains } from '../../configs/accessControls'
import { categoryDetailPath } from '../../constants/paths'
import {
  CategoryFormFields,
  mapCategoryFormToPayload,
} from '../../helpers/categoryForm.helpers'
import styles from './CategoryAddEditActions.module.scss'

type CategoryAddEditActionsProps = {
  /** Called when the form has errors, e.g. to show their tab. */
  readonly onInvalid: () => void
}

/** Ported from management-dashboard `modules/categories/components/CategoryAddEditActions`. */
const CategoryAddEditActions = ({ onInvalid }: CategoryAddEditActionsProps) => {
  const { t } = useTranslation()
  const { handleSubmit, formState, reset } =
    useFormContext<CategoryFormFields>()
  const { category, syncCategory } = useCategoryData()
  const { createCategory, updateCategory } = useCategoriesApi()
  const { rebuildForCategories } = useCategoryTreeRebuild()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError, showToast } = useToast()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const [isSaving, setIsSaving] = useState(false)

  // The category is saved by then, so a failed rebuild leaves only its tree
  // stale. One toast only: two shown at once replace each other.
  const rebuildAndNotify = async (categoryIds: string[], title: string) => {
    try {
      await rebuildForCategories(categoryIds)
      showSuccess(title)
    } catch (e) {
      console.error(e)
      showToast(title, t('categories.actions.rebuild.error'), 'warn')
    }
  }

  const save = async (data: CategoryFormFields) => {
    setIsSaving(true)
    try {
      const payload = mapCategoryFormToPayload(data, category)
      if (category) {
        await makeCall(() => updateCategory(payload), blockPanel)
        // Rebuild the category's root, and after a move also the old one.
        const oldParentId = category.parentId
        await rebuildAndNotify(
          [
            category.id,
            ...(oldParentId && oldParentId !== payload.parentId
              ? [oldParentId]
              : []),
          ],
          t('categories.edit.toast.update.success')
        )
        reset(data)
        await syncCategory()
      } else {
        const id = await makeCall(() => createCategory(payload), blockPanel)
        await rebuildAndNotify([id], t('categories.edit.toast.create.success'))
        navigate(categoryDetailPath(id), {
          replace: true,
          preserveAllQuery: true,
        })
      }
    } catch (e) {
      console.error(e)
      showError(t('categories.edit.toast.update.error'), getApiErrorDetails(e))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.actions}>
      <SecondaryButton
        disabled={!formState.isDirty || !canManage || isSaving}
        onClick={() => reset()}
        data-testid="category-discard"
      >
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        loading={isSaving}
        disabled={!formState.isDirty || !canManage || isSaving}
        onClick={() => void handleSubmit(save, onInvalid)()}
        data-testid="category-save"
      >
        {t('global.save')}
      </PrimaryButton>
    </div>
  )
}

export default CategoryAddEditActions
