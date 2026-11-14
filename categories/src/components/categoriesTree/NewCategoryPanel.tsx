import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  InputSwitch,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import { usePermissions } from '../../context/PermissionsProvider'
import { getApiErrorDetails } from '../../helpers/api'
import { Category } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import CategoryDetailsFields from './CategoryDetailsFields'
import {
  CategoryDetailsForm,
  createCategoryDetailsForm,
  toNewCategory,
} from './categoryDetails.helpers'
import styles from './CategoryTree.module.scss'
import columns from '../shared/FormColumns.module.scss'

type NewCategoryPanelProps = {
  /** Where the category goes, e.g. "Below Shoes". */
  readonly placement: string
  readonly onCreate: (category: Partial<Category>) => Promise<void>
  readonly onCancel: () => void
}

/** Ported from management-dashboard `NewCategoryPanel` (standard categories). */
const NewCategoryPanel = ({
  placement,
  onCreate,
  onCancel,
}: NewCategoryPanelProps) => {
  const { t } = useTranslation()
  const toast = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const [isCreating, setIsCreating] = useState(false)

  // As on the full add page, a new category starts unpublished.
  const { control, handleSubmit } = useForm<CategoryDetailsForm>({
    defaultValues: createCategoryDetailsForm(false),
  })

  const create = async (values: CategoryDetailsForm) => {
    setIsCreating(true)
    try {
      await onCreate(toNewCategory(values))
    } catch (e) {
      console.error(e)
      toast.showError(
        t('categories.edit.toast.update.error'),
        getApiErrorDetails(e)
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div data-testid="new-category-panel">
      <div className={styles.detailsHeader}>
        <div className={styles.detailsHeading}>
          <div className={styles.detailsTitle}>
            {t('categories.tree.newCategory.title')}
          </div>
          <small className={styles.detailsPlacement}>{placement}</small>
        </div>
        <div className={styles.detailsActions}>
          <SecondaryButton
            disabled={isCreating}
            onClick={onCancel}
            data-testid="new-category-cancel"
          >
            {t('global.cancel')}
          </SecondaryButton>
          <PrimaryButton
            loading={isCreating}
            disabled={!canManage || isCreating}
            onClick={() => void handleSubmit(create)()}
            data-testid="new-category-create"
          >
            {t('global.create')}
          </PrimaryButton>
        </div>
      </div>
      <div className={styles.detailsFields}>
        <CategoryDetailsFields control={control} canManage={canManage} isNew />
        <FormGridRow>
          <InputField
            className={columns.col12Xl6}
            label={t('categories.edit.tab.validity.published')}
            name="new-category-published"
          >
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  inputId="new-category-published"
                  disabled={!canManage}
                  checked={field.value}
                  onChange={(event) => field.onChange(event.value)}
                />
              )}
            />
          </InputField>
        </FormGridRow>
      </div>
    </div>
  )
}

export default NewCategoryPanel
