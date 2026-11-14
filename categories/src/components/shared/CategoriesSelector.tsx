import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  PaginatedSelector,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { StylableProps } from '../../helpers/props'
import { useCategoriesApi } from '../../hooks/api/categories'
import { usePermissions } from '../../context/PermissionsProvider'
import { Category, CategoryType } from '../../models/Category.model'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { EmployeeDomains } from '../../configs/accessControls'

type CategoriesSelectorProps = StylableProps & {
  readonly value?: string | string[]
  /** The id when `singleSelection`, the ids otherwise (MD contract). */
  readonly onChange: (value: string | string[] | undefined) => void
  /** Overrides the default edit right taken from the target entity's manager role. */
  readonly canManage?: boolean
  readonly singleSelection?: boolean
  readonly type?: CategoryType
  readonly showRoots?: boolean
  readonly showUnpublished?: boolean
  readonly 'data-testid'?: string
}

const filterClassificationParents = [
  {
    name: { en: 'Name', de: 'Name' },
    code: 'localizedName',
  },
]

/**
 * MD `components/shared/CategoriesSelector` on the component library
 * `PaginatedSelector` (same port as the coupons and products remotes).
 */
const CategoriesSelector = ({
  className,
  value,
  onChange,
  singleSelection,
  type,
  showRoots,
  showUnpublished,
  canManage,
  'data-testid': testId,
}: CategoriesSelectorProps) => {
  const { t } = useTranslation()
  const { getCategoriesPaginated, getAllCategories } = useCategoriesApi()
  const { hasPermission } = usePermissions()
  const { getContentLangValue, getUiLangValue, contentLanguage } =
    useLocalizedValue()

  const resolveCategories = async (selected: string | string[]) => {
    const params = {
      currentPage: 1,
      rows: 100,
      filters: {
        id: {
          value: selected,
          matchMode: FilterMatchMode.EQUALS,
        },
      },
    }
    return getAllCategories(params, type, showRoots, showUnpublished)
  }

  const searchCategories = async (params: DataTablePaginationState) =>
    getCategoriesPaginated(
      params as Partial<PaginationProps>,
      type,
      showRoots,
      showUnpublished
    )

  const itemTemplate = useCallback(
    (item: Category) => getContentLangValue(item.localizedName || item.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentLanguage]
  )

  return (
    <PaginatedSelector<Category>
      className={className}
      value={value}
      onChange={onChange}
      searchFn={searchCategories}
      resolveSelected={resolveCategories}
      canManage={canManage ?? hasPermission(EmployeeDomains.CATEGORIES_MANAGER)}
      canView={hasPermission(EmployeeDomains.CATEGORIES_VIEWER)}
      filters={filterClassificationParents.map((filter) => ({
        code: filter.code,
        label: getUiLangValue(filter.name),
      }))}
      itemTemplate={itemTemplate}
      singleSelection={singleSelection}
      searchPlaceholder={(filterLabel) =>
        t('mixins.labels.search', { filter: filterLabel.toLowerCase() })
      }
      noDataMessage={t('global.noData')}
      noPermissionMessage={t('global.noPermissions')}
      removeItemAriaLabel={t('global.remove')}
      filterAriaLabel={t('global.toggleOptions')}
      data-testid={testId}
    />
  )
}

export default CategoriesSelector
