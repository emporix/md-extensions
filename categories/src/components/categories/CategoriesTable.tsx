import { type Ref, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  DataTable,
  TableExtensions,
  useToast,
  type DataTablePaginationState,
  type TableExtensionsColumn,
} from '@emporix/component-library'
import TableActions from '../shared/TableActions'
import MixinColumns from '../shared/MixinColumns'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import ViewSwitch, { type ListType } from './ViewSwitch'
import CategoriesTree, {
  type CategoriesTreeHandle,
} from '../categoriesTree/CategoriesTree'
import usePagination from '../../hooks/usePagination'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useCategoryTreeRebuild } from '../../hooks/api/categoryTreeRebuild'
import useCategoriesColumns from '../../hooks/useCategoriesColumns'
import { useCategoriesTableConfig } from '../../hooks/useCategoriesTableConfig'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import { StylableProps } from '../../helpers/props'
import { parseTableColumns } from '../../helpers/tables'
import { toColumnVisibility } from '../../helpers/categoriesTable.helpers'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { SchemaType } from '../../models/Schema.model'
import { Category, CategoryType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { VIEW_PARAM, categoryDetailPath } from '../../constants/paths'
import styles from './CategoriesTable.module.scss'

type CategoriesTableProps = StylableProps & {
  /** Set while the tree view is shown. */
  readonly treeRef?: Ref<CategoriesTreeHandle>
}

/**
 * The categories list (server-paged table) and tree view. Ported from
 * management-dashboard `modules/categories/components/CategoriesTable`.
 */
const CategoriesTable = ({ className = '', treeRef }: CategoriesTableProps) => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const displayType: ListType =
    searchParams.get(VIEW_PARAM) === 'tree' ? 'tree' : 'list'
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useCategoriesColumns()
  const { showSuccess, showError } = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const { tenant } = useDashboardContext()
  const { blockPanel } = useUIBlocker()
  const {
    paginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
    setFilters,
  } = usePagination()
  const { getCategoriesPaginated, deleteCategory } = useCategoriesApi()
  const { resolveRoots, rebuildRoots } = useCategoryTreeRebuild()
  const { navigate } = useCustomNavigate()
  const { visibleColumns, visibleMixins, saveTableConfig, isSaving } =
    useCategoriesTableConfig()
  // Draft of the mixin columns in the settings panel, reset when it opens.
  const [draftMixins, setDraftMixins] = useState<DisplayMixin[]>([])
  const { getUiLangValue, getContentLangValue } = useLocalizedValue()

  const [data, setData] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  // Bumped by every load, so a response for earlier params or tenant is dropped.
  const loadIdRef = useRef(0)

  // Rows of another tenant must not stay usable while its categories load.
  useUpdateEffect(() => {
    setData([])
    setTotalCount(0)
    setSelectedCategories([])
  }, [tenant])

  useEffect(() => {
    if (displayType === 'list') {
      void loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, paginationParams, tenant, displayType])

  const loadCategories = async () => {
    const loadId = ++loadIdRef.current
    try {
      setIsLoading(true)
      const { values, totalRecords } = await getCategoriesPaginated(
        paginationParams,
        CategoryType.STANDARD,
        false,
        true
      )
      if (loadId !== loadIdRef.current) return
      setData(values)
      setTotalCount(totalRecords)
    } catch (e) {
      console.error(e)
    } finally {
      if (loadId === loadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  const changeDisplayType = (view: ListType) => {
    const params = new URLSearchParams(searchParams)
    params.set(VIEW_PARAM, view)
    setSearchParams(params, { replace: true })
    setSelectedCategories([])
  }

  const deleteCategories = async (categories: Category[]) => {
    setIsDeleting(true)
    blockPanel(true)
    const ids = categories.map(({ id }) => id)
    const failed: Category[] = []
    let roots: string[] = []
    try {
      // Resolve the roots first: /parents answers 404 for a deleted category.
      roots = await resolveRoots(ids)
      for (const category of categories) {
        try {
          await deleteCategory(category.id)
        } catch (e) {
          console.error(e)
          failed.push(category)
        }
      }
    } catch (e) {
      // Without the roots their trees cannot be rebuilt, so nothing is deleted.
      console.error(e)
      failed.push(...categories)
    }
    // One toast only: two shown at once replace each other.
    if (failed.length > 0) {
      showError(
        t('categories.actions.batchDelete.failedSingle', {
          categoryName: failed
            .map(
              ({ id, localizedName }) =>
                (localizedName && getContentLangValue(localizedName)) || id
            )
            .join(', '),
        })
      )
    } else {
      showSuccess(
        t('categories.actions.batchDelete.success', {
          numberOfCategories: categories.length,
        })
      )
    }
    const failedIds = new Set(failed.map(({ id }) => id))
    try {
      // A deleted root takes its tree with it; only rebuild the others.
      await rebuildRoots(
        roots.filter((root) => !ids.includes(root) || failedIds.has(root))
      )
    } catch (e) {
      console.error(e)
      showError(t('categories.actions.rebuild.error'), '')
    }
    setSelectedCategories((selected) =>
      selected.filter(({ id }) => !ids.includes(id) || failedIds.has(id))
    )
    blockPanel(false)
    setIsDeleting(false)
    setRefreshValue()
  }

  const openCategory = (category: Category) => {
    navigate(categoryDetailPath(category.id))
  }

  const actionsTemplate = (category: Category) => (
    <TableActions
      onEdit={() => openCategory(category)}
      onDelete={() => deleteCategories([category])}
      deleteConfirm={{ pluralsPath: 'categories', entity: category }}
      managerPermission={canManage}
    />
  )

  const columnsToDisplay = useMemo(
    () =>
      parseTableColumns(
        columns,
        visibleColumns,
        visibleMixins,
        getUiLangValue,
        setFilters
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFilters is stable in effect
    [columns, visibleColumns, visibleMixins, getUiLangValue]
  )

  const saveColumns = (columnsToSave: TableExtensionsColumn[]) =>
    saveTableConfig(columnsToSave, draftMixins)

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={className}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          className={styles.batchDelete}
          isDeleting={isDeleting}
          disabled={!canManage}
          selected={selectedCategories}
          pluralsPath="categories"
          onDelete={() => deleteCategories(selectedCategories)}
        />
        <ViewSwitch value={displayType} onChange={changeDisplayType} />
        {displayType === 'list' && (
          <TableExtensions
            columns={toColumnVisibility(columns, visibleColumns)}
            onSave={saveColumns}
            onOpen={() => setDraftMixins(visibleMixins)}
            disabled={!canManage}
            saving={isSaving}
            labels={{
              open: t('global.tableExtensions.columns'),
              close: t('global.close'),
              save: t('global.save'),
            }}
            data-testid="categories-table-extensions"
          >
            <MixinColumns
              managerPermission={canManage}
              selectedMixins={draftMixins}
              setSelectedMixins={setDraftMixins}
              schemaType={SchemaType.CATEGORY}
            />
          </TableExtensions>
        )}
      </div>
      {displayType === 'tree' ? (
        <CategoriesTree ref={treeRef} />
      ) : (
        <DataTable
          dataKey="id"
          value={data}
          columns={columnsToDisplay}
          lazy={true}
          loading={isLoading}
          selection={selectedCategories}
          selectionMode="multiple"
          onSelectionChange={(selection) =>
            setSelectedCategories(selection as Category[])
          }
          pagination={pagination}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          onPage={onPageCallback}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          onRowClick={openCategory}
          rowActions={actionsTemplate}
          data-testid="categories-table"
        />
      )}
    </div>
  )
}

export default CategoriesTable
