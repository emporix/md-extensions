import {
  type ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useSearchParams } from 'react-router'
import { ConfirmBox, useToast, type TreeNode } from '@emporix/component-library'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { CategoryTree } from '../../models/Category.model'
import {
  SELECTED_CATEGORY_PARAM,
  categoryDetailPath,
} from '../../constants/paths'
import CategoryTreeBase, {
  type CategoryTreeAsideProps,
  type CategoryTreeBaseHandle,
} from './CategoryTreeBase'
import CategoryNodeTemplate from './CategoryNodeTemplate'
import CategoryDetailsPanel from './CategoryDetailsPanel'
import NewCategoryPanel from './NewCategoryPanel'
import { AddCategoryTarget } from './categoriesTree.helpers'
import styles from './CategoryTree.module.scss'

export interface CategoriesTreeHandle {
  /** Starts adding a category at the end of the top level. */
  addCategory: () => void
}

/**
 * The tree view of the categories list: ported from management-dashboard
 * `components/categoriesTree/CategoriesTree` (standard categories only). The
 * selection lives in `?categoryId=`, next to `?view=tree`.
 */
const CategoriesTree = (
  _props: object,
  ref: ForwardedRef<CategoriesTreeHandle>
) => {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get(SELECTED_CATEGORY_PARAM) ?? undefined
  const { navigate } = useCustomNavigate()
  const { getContentLangValue } = useLocalizedValue()
  const { setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const { showError } = useToast()
  const treeRef = useRef<CategoryTreeBaseHandle>(null)
  const entityName = t('categories.singular')

  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTree | null>(
    null
  )
  // Set while the panel adds a category next to or into the selected one.
  const [newCategoryTarget, setNewCategoryTarget] =
    useState<AddCategoryTarget | null>(null)

  // A pending delete or new category belongs to the previous tenant's tree.
  useUpdateEffect(() => {
    setCategoryToDelete(null)
    setNewCategoryTarget(null)
  }, [tenant])

  const selectCategory = (id?: string) => {
    const params = new URLSearchParams(searchParams)
    if (id) {
      params.set(SELECTED_CATEGORY_PARAM, id)
    } else {
      params.delete(SELECTED_CATEGORY_PARAM)
    }
    setSearchParams(params, { replace: true })
    setNewCategoryTarget(null)
  }

  // The anchor gets selected; without one the new category goes last at the
  // top level.
  const startNewCategory = (target: AddCategoryTarget, anchorId?: string) => {
    selectCategory(anchorId)
    setNewCategoryTarget(target)
  }

  useImperativeHandle(ref, () => ({
    addCategory: () => startNewCategory('child'),
  }))

  const openCategory = (id: string) => {
    const currentPath = `${location.pathname}${location.search}`
    navigate(categoryDetailPath(id), {
      query: { backTo: currentPath },
    })
  }

  const handleSelectCategory = (category: CategoryTree) => {
    // Clicking the anchor of a new category shows its details again.
    if (category.id !== selectedId || newCategoryTarget) {
      selectCategory(category.id)
    }
  }

  const handleAddNode = (node: TreeNode, target: AddCategoryTarget) =>
    startNewCategory(target, String(node.key))

  const confirmDelete = async () => {
    const tree = treeRef.current
    if (!categoryToDelete || !tree) return
    try {
      setIsDeleting(true)
      await tree.deleteCategory(categoryToDelete.id)
      if (categoryToDelete.id === selectedId) {
        selectCategory(undefined)
      }
      setCategoryToDelete(null)
      setRefreshValue()
    } catch (e) {
      console.error(e)
      showError(
        t('categories.actions.batchDelete.failedSingle', {
          categoryName: getContentLangValue(categoryToDelete.localizedName),
        })
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const renderAside = ({
    category,
    siblings,
    saveCategory,
    createCategory,
  }: CategoryTreeAsideProps) => {
    // The anchor is gone when it was deleted together with its parent.
    const isAnchorMissing = !!selectedId && !category
    if (newCategoryTarget && !isAnchorMissing) {
      return (
        <NewCategoryPanel
          key={`${newCategoryTarget}-${selectedId}`}
          placement={
            category
              ? t(`categories.tree.newCategory.${newCategoryTarget}`, {
                  name: getContentLangValue(category.localizedName),
                })
              : t('categories.tree.newCategory.topLevel')
          }
          onCreate={async (newCategory) => {
            const id = await createCategory(newCategory, {
              target: newCategoryTarget,
              anchorId: selectedId,
            })
            selectCategory(id)
            setRefreshValue()
          }}
          onCancel={() => setNewCategoryTarget(null)}
        />
      )
    }
    if (category) {
      return (
        <CategoryDetailsPanel
          key={category.id}
          category={category}
          siblings={siblings}
          onSave={(changes) => saveCategory(category.id, changes)}
          onOpenFullEdit={() => openCategory(category.id)}
          onDelete={() => setCategoryToDelete(category)}
        />
      )
    }
    return (
      <div className={styles.detailsEmpty}>
        {t('categories.tree.details.empty')}
      </div>
    )
  }

  return (
    <>
      <CategoryTreeBase
        ref={treeRef}
        reorderable
        selectionMode="single"
        selectionKeys={selectedId ?? null}
        onSelectCategory={handleSelectCategory}
        nodeTemplate={(node, options) => (
          <CategoryNodeTemplate
            node={node}
            labelClassName={options.className}
            onAdd={handleAddNode}
          />
        )}
        aside={renderAside}
      />
      <ConfirmBox
        visible={!!categoryToDelete}
        loading={isDeleting}
        title={`${t('global.delete')} ${entityName}?`}
        message={t('global.deleteConfirm.singular.description', {
          action: t('global.delete').toLowerCase(),
          entity: entityName.toLowerCase(),
          id: categoryToDelete
            ? getContentLangValue(categoryToDelete.localizedName)
            : '',
        })}
        acceptLabel={t('global.delete')}
        rejectLabel={t('global.cancel')}
        onAccept={() => void confirmDelete()}
        onReject={() => setCategoryToDelete(null)}
        data-testid="category-tree-delete-confirm"
      />
    </>
  )
}

export default forwardRef(CategoriesTree)
