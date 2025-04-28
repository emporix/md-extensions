import { Category } from '../../models/Category'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategoriesApi } from '../../api/categories'

import { useRefresh } from '../../context/RefreshValuesProvider'
import { makeCall } from '../../helpers/api'
import ConfirmBox from '../shared/ConfirmBox'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import TableActions from '../shared/TableActions'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export function CategoryActions(props: { category: Category }) {
  const { category } = props
  const { deleteCategory } = useCategoriesApi()
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { setRefreshValue } = useRefresh()
  const { getContentLangValue } = useLocalizedValue()
  const [dialogVisible, setDialogVisible] = useState(false)
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.categories?.manager

  const deleteCall = useCallback(() => {
    makeCall(() => deleteCategory(category.id), setRefreshValue)
    setDialogVisible(false)
  }, [setRefreshValue, deleteCategory, category.id])

  return (
    <div className="flex justify-content-end">
      <TableActions
        managerPermission={canBeManaged}
        onDelete={() => setDialogVisible(true)}
        onEdit={() => navigate(`/categories/${category.id}`)}
      />
      <ConfirmBox
        key="delete-confirm-box"
        message={t('categories.actions.delete.title', {
          categoryName: getContentLangValue(category.localizedName),
        })}
        title={t('categories.actions.delete.message')}
        onReject={() => setDialogVisible(false)}
        visible={dialogVisible}
        onAccept={deleteCall}
      />
    </div>
  )
}
