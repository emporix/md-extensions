import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import ClassificationsTable from '../components/classifications/ClassificationsTable'
import { type CategoriesTreeHandle } from '../components/categoriesTree/CategoriesTree'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { classificationAddPath } from '../constants/paths'

/**
 * Ported from management-dashboard
 * `modules/classifications/pages/ClassificationsList.page`.
 */
const ClassificationsListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const treeRef = useRef<CategoriesTreeHandle>(null)

  return (
    <>
      <HeaderSection
        title={t('classifications.plurals.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() =>
              // The tree view adds the classification in its side panel.
              treeRef.current
                ? treeRef.current.addCategory()
                : navigate(classificationAddPath())
            }
            data-testid="classifications-add"
          >
            {t('classifications.buttons.createClassification')}
          </PrimaryButton>
        }
      />
      <ClassificationsTable treeRef={treeRef} />
    </>
  )
}

export default ClassificationsListPage
