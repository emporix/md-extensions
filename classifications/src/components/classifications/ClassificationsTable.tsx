import { type Ref, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  DataTable,
  TableExtensions,
  useToast,
  type DataTablePaginationState,
} from '@emporix/component-library'
import TableActions from '../shared/TableActions'
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
import useClassificationsColumns from '../../hooks/useClassificationsColumns'
import { useClassificationsTableConfig } from '../../hooks/useClassificationsTableConfig'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { StylableProps } from '../../helpers/props'
import { parseTableColumns } from '../../helpers/tables'
import { toColumnVisibility } from '../../helpers/classificationsTable.helpers'
import { Category, CategoryType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { VIEW_PARAM, classificationDetailPath } from '../../constants/paths'
import styles from './ClassificationsTable.module.scss'

const PLURALS_PATH = 'classifications.plurals'

// MD's default order: newest first (the default sort order is descending).
const INITIAL_PAGINATION = { sortField: 'metadata.createdAt' }

type ClassificationsTableProps = StylableProps & {
  /** Set while the tree view is shown. */
  readonly treeRef?: Ref<CategoriesTreeHandle>
}

/**
 * The classifications list (server-paged table) and tree view. Ported from
 * management-dashboard `modules/classifications/components/ClassificationsTable`.
 * The column settings offer no mixin columns: MD offered them, but its table
 * never rendered any.
 */
const ClassificationsTable = ({
  className = '',
  treeRef,
}: ClassificationsTableProps) => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const displayType: ListType =
    searchParams.get(VIEW_PARAM) === 'tree' ? 'tree' : 'list'
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useClassificationsColumns()
  const { showSuccess, showError } = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const { tenant } = useDashboardContext()
  const {
    paginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
    setFilters,
  } = usePagination(INITIAL_PAGINATION)
  const { getCategoriesPaginated, deleteCategory } = useCategoriesApi()
  const { resolveRoots, rebuildRoots } = useCategoryTreeRebuild()
  const { navigate } = useCustomNavigate()
  const { visibleColumns, saveTableConfig, isSaving } =
    useClassificationsTableConfig()
  const { getUiLangValue } = useLocalizedValue()

  const [data, setData] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedClassifications, setSelectedClassifications] = useState<
    Category[]
  >([])
  // Bumped by every load, so a response for earlier params or tenant is dropped.
  const loadIdRef = useRef(0)

  // Rows of another tenant must not stay usable while its classifications load.
  useUpdateEffect(() => {
    setData([])
    setTotalCount(0)
    setSelectedClassifications([])
  }, [tenant])

  useEffect(() => {
    if (displayType === 'list') {
      void loadClassifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, paginationParams, tenant, displayType])

  const loadClassifications = async () => {
    const loadId = ++loadIdRef.current
    try {
      setIsLoading(true)
      const { values, totalRecords } = await getCategoriesPaginated(
        paginationParams,
        CategoryType.CLASSIFICATION,
        false,
        true
      )
      if (loadId !== loadIdRef.current) return
      setData(values)
      setTotalCount(totalRecords)
    } catch (e) {
      if (loadId !== loadIdRef.current) return
      console.error(e)
      showError(t('classifications.toasts.errorFetchClassifications'), '')
    } finally {
      if (loadId === loadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  const changeDisplayType = (view: ListType) => {
    const params = new URLSearchParams(searchParams)
    if (view === 'tree') {
      params.set(VIEW_PARAM, view)
    } else {
      params.delete(VIEW_PARAM)
    }
    setSearchParams(params)
    setSelectedClassifications([])
  }

  const deleteClassifications = async (classifications: Category[]) => {
    setIsDeleting(true)
    const ids = classifications.map(({ id }) => id)
    let roots: string[]
    try {
      // Resolve the roots first: /parents answers 404 for a deleted category.
      roots = await resolveRoots(ids)
    } catch (e) {
      // Without the roots their trees cannot be rebuilt, so nothing is deleted.
      console.error(e)
      showError(t('classifications.toasts.errorDeleteClassification'), '')
      setIsDeleting(false)
      return
    }
    const failedIds = new Set<string>()
    for (const { id } of classifications) {
      try {
        await deleteCategory(id)
        showSuccess(t('classifications.toasts.successDeleteClassifications'))
      } catch (e) {
        console.error(e)
        failedIds.add(id)
        showError(t('classifications.toasts.errorDeleteClassification'), '')
      }
    }
    // What could not be deleted stays selected.
    setSelectedClassifications((selected) =>
      selected.filter(({ id }) => !ids.includes(id) || failedIds.has(id))
    )
    try {
      // A deleted root takes its tree with it; only rebuild the others.
      await rebuildRoots(
        roots.filter((root) => failedIds.has(root) || !ids.includes(root))
      )
    } catch (e) {
      console.error(e)
      showError(t('categories.actions.rebuild.error'), '')
    }
    setIsDeleting(false)
    setRefreshValue()
  }

  const openClassification = (classification: Category) => {
    navigate(classificationDetailPath(classification.id))
  }

  const actionsTemplate = (classification: Category) => (
    <TableActions
      onEdit={() => openClassification(classification)}
      onDelete={() => deleteClassifications([classification])}
      deleteConfirm={{ pluralsPath: PLURALS_PATH, entity: classification }}
      managerPermission={canManage}
      disabled={!canManage}
    />
  )

  const columnsToDisplay = useMemo(
    () =>
      parseTableColumns(
        columns,
        visibleColumns,
        [],
        getUiLangValue,
        setFilters
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFilters is stable in effect
    [columns, visibleColumns, getUiLangValue]
  )

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
          disabled={isLoading || isDeleting || !canManage}
          selected={selectedClassifications}
          pluralsPath={PLURALS_PATH}
          onDelete={() => deleteClassifications(selectedClassifications)}
        />
        <ViewSwitch value={displayType} onChange={changeDisplayType} />
        <TableExtensions
          columns={toColumnVisibility(columns, visibleColumns)}
          onSave={saveTableConfig}
          disabled={!canManage}
          saving={isSaving}
          labels={{
            open: t('global.tableExtensions.columns'),
            close: t('global.close'),
            save: t('global.save'),
          }}
          data-testid="classifications-table-extensions"
        />
      </div>
      {displayType === 'tree' ? (
        <CategoriesTree ref={treeRef} />
      ) : (
        <DataTable
          dataKey="id"
          value={data}
          columns={columnsToDisplay}
          lazy={true}
          loading={isLoading || isDeleting}
          selection={selectedClassifications}
          selectionMode="multiple"
          onSelectionChange={(selection) =>
            setSelectedClassifications(selection as Category[])
          }
          emptyMessage={t('classifications.tables.classifications.emptyText')}
          pagination={pagination}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          onPage={onPageCallback}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          onRowClick={openClassification}
          rowActions={actionsTemplate}
          data-testid="classifications-table"
        />
      )}
    </div>
  )
}

export default ClassificationsTable
