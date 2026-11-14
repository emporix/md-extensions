import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  IconButton,
  InputNumber,
  InputSwitch,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { BsPencilFill, BsTrashFill } from 'react-icons/bs'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import { usePermissions } from '../../context/PermissionsProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { getApiErrorDetails } from '../../helpers/api'
import { formatDate } from '../../helpers/date'
import { hasLocalizedValue } from '../../helpers/localized'
import { Category, CategoryTree } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import CategoryDetailsFields from './CategoryDetailsFields'
import {
  CategoryDetailsForm,
  findPositionConflicts,
  getCategoryDetailsChanges,
  toCategoryDetailsForm,
} from './categoryDetails.helpers'
import styles from './CategoryTree.module.scss'
import columns from '../shared/FormColumns.module.scss'

const LISTED_CONFLICTS = 3

type CategoryDetailsPanelProps = {
  readonly category: CategoryTree
  readonly siblings: CategoryTree[]
  readonly onSave: (changes: Partial<Category>) => Promise<void>
  readonly onOpenFullEdit: () => void
  readonly onDelete: () => void
}

/** Ported from management-dashboard `CategoryDetailsPanel` (tree quick edit). */
const CategoryDetailsPanel = ({
  category,
  siblings,
  onSave,
  onOpenFullEdit,
  onDelete,
}: CategoryDetailsPanelProps) => {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const [isSaving, setIsSaving] = useState(false)

  const { control, reset, watch, handleSubmit, formState } =
    useForm<CategoryDetailsForm>({
      defaultValues: toCategoryDetailsForm(category),
    })
  const { isDirty, errors } = formState
  const requiredMessage = t('categories.edit.validation.required')
  // Shows which category is open; the id stands in for a missing name.
  const title = hasLocalizedValue(category.localizedName)
    ? getContentLangValue(category.localizedName)
    : category.id

  // The tree hands over fresh data after a save, a move or a reload; keep
  // whatever the user is still editing.
  useEffect(() => {
    reset(toCategoryDetailsForm(category), { keepDirtyValues: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const positionConflicts = findPositionConflicts(
    siblings,
    category.id,
    watch('position')
  )
  const conflictNames = positionConflicts
    .slice(0, LISTED_CONFLICTS)
    .map(({ localizedName }) => getContentLangValue(localizedName))
    .join(', ')
  const moreConflicts = positionConflicts.length - LISTED_CONFLICTS

  const save = async (values: CategoryDetailsForm) => {
    const changes = getCategoryDetailsChanges(
      toCategoryDetailsForm(category),
      values
    )
    if (Object.keys(changes).length === 0) {
      reset(values)
      return
    }
    setIsSaving(true)
    try {
      await onSave(changes)
      reset(values)
    } catch (e) {
      console.error(e)
      toast.showError(
        t('categories.edit.toast.update.error'),
        getApiErrorDetails(e)
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div data-testid="category-details-panel">
      <div className={styles.detailsHeader}>
        <div className={styles.detailsHeading}>
          <div className={styles.detailsTitle} title={title}>
            {title}
          </div>
        </div>
        <div className={styles.detailsActions}>
          <IconButton
            icon={<BsTrashFill size={14} />}
            ariaLabel={t('global.delete')}
            tooltip={t('global.delete')}
            disabled={!canManage || isSaving}
            onClick={onDelete}
            data-testid="category-panel-delete"
          />
          <IconButton
            icon={<BsPencilFill size={14} />}
            ariaLabel={t('categories.tree.details.openFullEdit')}
            tooltip={t('categories.tree.details.openFullEdit')}
            onClick={onOpenFullEdit}
            data-testid="category-panel-open"
          />
          <SecondaryButton
            disabled={!isDirty || isSaving}
            onClick={() => reset(toCategoryDetailsForm(category))}
            data-testid="category-panel-discard"
          >
            {t('global.discard')}
          </SecondaryButton>
          <PrimaryButton
            loading={isSaving}
            disabled={!isDirty || !canManage || isSaving}
            onClick={() => void handleSubmit(save)()}
            data-testid="category-panel-save"
          >
            {t('global.save')}
          </PrimaryButton>
        </div>
      </div>
      <div className={styles.detailsFields}>
        <CategoryDetailsFields control={control} canManage={canManage} />
        <FormGridRow>
          <div className={columns.col12Xl6}>
            <Controller
              name="position"
              control={control}
              rules={{
                validate: (value) => value !== null || requiredMessage,
              }}
              render={({ field }) => (
                <InputNumber
                  label={t('categories.edit.tab.details.position')}
                  className={columns.fullWidth}
                  readOnly={!canManage}
                  value={field.value}
                  min={0}
                  useGrouping={false}
                  error={errors.position?.message}
                  onChange={(event) => field.onChange(event.value)}
                  data-testid="category-panel-position"
                />
              )}
            />
            {positionConflicts.length > 0 && (
              <small className={styles.detailsWarning}>
                <i className="pi pi-exclamation-triangle" />
                <span>
                  {t(
                    moreConflicts > 0
                      ? 'categories.tree.details.positionTakenMore'
                      : 'categories.tree.details.positionTaken',
                    { names: conflictNames, more: moreConflicts }
                  )}
                </span>
              </small>
            )}
          </div>
          <InputField
            className={columns.col12Xl6}
            label={t('categories.edit.tab.validity.published')}
            name="category-panel-published"
          >
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  inputId="category-panel-published"
                  disabled={!canManage}
                  checked={field.value}
                  onChange={(event) => field.onChange(event.value)}
                  data-testid="category-panel-published"
                />
              )}
            />
          </InputField>
        </FormGridRow>
        <FormGridRow>
          <InputField
            className={columns.col12Xl6}
            label={t('categories.table.validity.from')}
          >
            <span>{formatDate(category.validity?.from, i18n.language)}</span>
          </InputField>
          <InputField
            className={columns.col12Xl6}
            label={t('categories.table.validity.to')}
          >
            <span>{formatDate(category.validity?.to, i18n.language)}</span>
          </InputField>
        </FormGridRow>
      </div>
    </div>
  )
}

export default CategoryDetailsPanel
