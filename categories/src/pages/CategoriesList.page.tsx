import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import CategoriesTable from '../components/categories/CategoriesTable'
import { type CategoriesTreeHandle } from '../components/categoriesTree/CategoriesTree'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { categoryAddPath } from '../constants/paths'

/** Ported from management-dashboard `modules/categories/pages/CategoriesList.page`. */
const CategoriesListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const treeRef = useRef<CategoriesTreeHandle>(null)

  return (
    <>
      <HeaderSection
        title={t('categories.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() =>
              // The tree view adds the category in its side panel.
              treeRef.current
                ? treeRef.current.addCategory()
                : navigate(categoryAddPath())
            }
            data-testid="categories-add"
          >
            {t('categories.addNewCategory')}
          </PrimaryButton>
        }
      />
      <CategoriesTable treeRef={treeRef} />
    </>
  )
}

export default CategoriesListPage
