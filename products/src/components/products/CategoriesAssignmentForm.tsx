import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCategoriesApi } from '../../api/categories'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { Category } from '../../models/Category'
import { useProductData } from '../../context/ProductDataProvider'
import { Button } from 'primereact/button'
import SectionBox from '../shared/SectionBox'
import InputField from '../shared/InputField'
import { MultiSelect } from 'primereact/multiselect'
import { useUIBlocker } from '../../context/UIBlcoker'
import { InputText } from 'primereact/inputtext'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export const CategoriesAssignmentForm = () => {
  const { t } = useTranslation()
  const { product } = useProductData()
  const {
    getCategoriesPaginated,
    fetchCategoriesForAssignment,
    assignProductToCategory,
    deleteAssignmentToCategory,
  } = useCategoriesApi()

  const { blockPanel } = useUIBlocker()

  const [dirty, setDirty] = useState(false)

  const { getContentLangValue } = useLocalizedValue()

  const [categoryAssignmentIds, setCategoryAssignmentIds] = useState<string[]>(
    []
  )
  const [originalCategoryAssignmentIds, setOriginalCategoryAssignmentIds] =
    useState<string[]>([])

  const categoriesToBeRemoved = useMemo(() => {
    return originalCategoryAssignmentIds.filter(
      (originalAssignedCategoryId) =>
        !categoryAssignmentIds.includes(originalAssignedCategoryId)
    )
  }, [categoryAssignmentIds, originalCategoryAssignmentIds])

  const [categories, setCategories] = useState<Category[]>([])

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const canViewCategories = permissions?.categories?.viewer
  const canManageCategories = permissions?.categories?.manager

  useEffect(() => {
    if (canViewCategories) {
      ;(async () => {
        const { values } = await getCategoriesPaginated({ rows: 1000 })
        setCategories(
          values.map((cat) => ({
            ...cat,
            name: getContentLangValue(cat.localizedName),
          }))
        )

        const categoryAssignments = await fetchCategoriesForAssignment(
          product?.id as string
        )
        const assignedCategoryIds = categoryAssignments.map((cat) => cat.id)
        setCategoryAssignmentIds(assignedCategoryIds)
        setOriginalCategoryAssignmentIds([...assignedCategoryIds])
      })()
    }
  }, [])

  const submit = useCallback(async () => {
    try {
      blockPanel(true)

      await Promise.all(
        categoryAssignmentIds.map((categoryId) => {
          if (product.id) {
            return assignProductToCategory(categoryId, product.id)
          }
        })
      )
      await Promise.all(
        categoriesToBeRemoved.map((categoryId) => {
          if (product.id) {
            return deleteAssignmentToCategory(categoryId, product.id)
          }
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
      setDirty(false)
    }
  }, [categoriesToBeRemoved, categoryAssignmentIds])

  const reset = useCallback(() => {
    setCategoryAssignmentIds(originalCategoryAssignmentIds)
    setDirty(false)
  }, [originalCategoryAssignmentIds, categoryAssignmentIds])

  return (
    <>
      <div className="flex justify-content-end align-items-center">
        <Button
          disabled={!dirty || !canBeManaged || !canManageCategories}
          className="p-button-secondary"
          label={t('global.discard')}
          onClick={reset}
        />
        <Button
          className="ml-2"
          disabled={!dirty || !canBeManaged}
          label={t('global.save')}
          onClick={submit}
        />
      </div>
      <SectionBox name={t('products.edit.tab.general.category')}>
        <div className="grid">
          <InputField
            label={t('products.edit.tab.general.category')}
            name="published"
            className="col-6"
            noInheritance
          >
            {canViewCategories ? (
              <MultiSelect
                disabled={!canBeManaged || !canManageCategories}
                options={categories}
                optionLabel="name"
                optionValue="id"
                value={categoryAssignmentIds || []}
                filter
                filterBy="name"
                onChange={(event) => {
                  setDirty(true)
                  setCategoryAssignmentIds(event.target.value)
                }}
              />
            ) : (
              <InputText disabled value={t('global.noPermissions')} />
            )}
          </InputField>
        </div>
      </SectionBox>
    </>
  )
}
