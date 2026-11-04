import { useCallback, useEffect, useState } from 'react'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useTranslation } from 'react-i18next'
import { useProductData } from '../../context/ProductDataProvider'
import {
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import InputField from '../shared/InputField'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import CategoriesSelector from '../shared/CategoriesSelector'
import FormGrid from '../shared/FormGrid'
import FormGridRow from '../shared/FormGridRow'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import styles from './CategoriesAssignmentForm.module.scss'

const CategoriesAssignmentForm = () => {
  const { t } = useTranslation()
  const { product, refreshData } = useProductData()
  const {
    fetchCategoriesForAssignment,
    assignProductToCategory,
    deleteAssignmentToCategory,
  } = useCategoriesApi()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const { showSuccess } = useToast()

  const [dirty, setDirty] = useState(false)
  const [categoryAssignmentIds, setCategoryAssignmentIds] = useState<string[]>(
    []
  )
  const [originalCategoryAssignmentIds, setOriginalCategoryAssignmentIds] =
    useState<string[]>([])
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const canManageCategories = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  useEffect(() => {
    if (canViewCategories && product?.id) {
      ;(async () => {
        const categoryAssignments = await fetchCategoriesForAssignment(
          product.id as string
        )
        const assignedCategoryIds = categoryAssignments.map((cat) => cat.id)
        setCategoryAssignmentIds(assignedCategoryIds)
        setOriginalCategoryAssignmentIds([...assignedCategoryIds])
      })()
    }
  }, [product?.id, canViewCategories, fetchCategoriesForAssignment])

  const submit = useCallback(async () => {
    if (!product?.id) return
    try {
      blockPanel(true)
      setDirty(false)
      // Add new assignments
      const categoriesToBeAdded = categoryAssignmentIds.filter(
        (assignedCategoryId) =>
          !originalCategoryAssignmentIds.includes(assignedCategoryId)
      )
      await Promise.all(
        categoriesToBeAdded.map((categoryId) =>
          assignProductToCategory(categoryId, product.id as string)
        )
      )
      // Remove old assignments
      const categoriesToBeRemoved = originalCategoryAssignmentIds.filter(
        (originalAssignedCategoryId) =>
          !categoryAssignmentIds.includes(originalAssignedCategoryId)
      )
      await Promise.all(
        categoriesToBeRemoved.map((categoryId) =>
          deleteAssignmentToCategory(categoryId, product.id as string)
        )
      )
      showSuccess(t('products.edit.toast.update.success'))
      setOriginalCategoryAssignmentIds([...categoryAssignmentIds])
      // waiting for refresh because BE needs time to update the assignments
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await refreshData()
    } catch (error) {
      console.error('Error updating category assignments:', error)
    } finally {
      blockPanel(false)
    }
  }, [
    product?.id,
    categoryAssignmentIds,
    originalCategoryAssignmentIds,
    assignProductToCategory,
    deleteAssignmentToCategory,
    blockPanel,
    refreshData,
    showSuccess,
    t,
  ])

  const reset = useCallback(() => {
    setCategoryAssignmentIds([...originalCategoryAssignmentIds])
    setDirty(false)
  }, [originalCategoryAssignmentIds])

  const handleCategoryChange = useCallback((newCategoryIds: string[]) => {
    setCategoryAssignmentIds(newCategoryIds)
    setDirty(true)
  }, [])

  return (
    <>
      <SectionBox
        name={t('products.edit.tab.general.category')}
        actions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!dirty || !canManage || !canManageCategories}
              onClick={reset}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton disabled={!dirty || !canManage} onClick={submit}>
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      >
        <FormGrid>
          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.category')}
              name="published"
              className={styles.fullWidth}
              noInheritance
            >
              <CategoriesSelector
                value={categoryAssignmentIds}
                onChange={handleCategoryChange}
              />
            </InputField>
          </FormGridRow>
        </FormGrid>
      </SectionBox>
    </>
  )
}

export default CategoriesAssignmentForm
