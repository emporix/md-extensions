import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  PaginatedSelector,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { StylableProps } from '../../helpers/props'
import { useSegmentsApi } from '../../hooks/api/segments'
import { usePermissions } from '../../context/PermissionsProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Segment } from '../../models/Segment.model'
import { EmployeeDomains } from '../../configs/accessControls'

type SegmentsSelectorProps = StylableProps & {
  readonly value?: string | string[]
  /** MD contract: segment ids. */
  readonly onChange: (v: string[]) => void
  /** Overrides the default edit right taken from the target entity's manager role. */
  readonly canManage?: boolean
}

const filters = [
  { name: { en: 'Name', de: 'Name' }, code: 'name' },
  { name: { en: 'ID', de: 'ID' }, code: 'id' },
]

/** Port of MD `components/shared/SegmentsSelector` onto CL `PaginatedSelector`. */
const SegmentsSelector = ({
  className,
  value,
  onChange,
  canManage,
}: SegmentsSelectorProps) => {
  const { t } = useTranslation()
  const { getSegments, getAllSegments } = useSegmentsApi()
  const { hasPermission } = usePermissions()
  const { getContentLangValue, getUiLangValue, contentLanguage } =
    useLocalizedValue()

  const resolveSegments = async (selected: string | string[]) =>
    getAllSegments({
      currentPage: 1,
      rows: 100,
      filters: {
        id: { value: selected, matchMode: FilterMatchMode.EQUALS },
      },
    } as Partial<PaginationProps>)

  const searchSegments = async (params: DataTablePaginationState) => {
    const { segments, totalRecords } = await getSegments(
      params as Partial<PaginationProps>
    )
    return { values: segments, totalRecords }
  }

  const itemTemplate = useCallback(
    (item: Segment) => (item.name ? getContentLangValue(item.name) : item.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [contentLanguage]
  )

  return (
    <PaginatedSelector<Segment>
      className={className}
      value={value}
      onChange={(next) => onChange(next as string[])}
      searchFn={searchSegments}
      resolveSelected={resolveSegments}
      canManage={canManage ?? hasPermission(EmployeeDomains.SEGMENTS_MANAGER)}
      canView={hasPermission(EmployeeDomains.SEGMENTS_VIEWER)}
      filters={filters.map((filter) => ({
        code: filter.code,
        label: getUiLangValue(filter.name),
      }))}
      itemTemplate={itemTemplate}
      searchPlaceholder={(filterLabel) =>
        t('mixins.labels.search', { filter: filterLabel.toLowerCase() })
      }
      noDataMessage={t('global.noData')}
      noPermissionMessage={t('global.noPermissions')}
      removeItemAriaLabel={t('global.remove')}
      filterAriaLabel={t('global.toggleOptions')}
    />
  )
}

export default SegmentsSelector
