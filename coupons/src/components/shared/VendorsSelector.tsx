import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  PaginatedSelector,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { StylableProps } from '../../helpers/props'
import { useVendorsApi } from '../../hooks/api/vendors'
import { usePermissions } from '../../context/PermissionsProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Vendor } from '../../models/Vendor.model'
import { EmployeeDomains } from '../../configs/accessControls'

type VendorsSelectorProps = StylableProps & {
  readonly value?: string | string[]
  /** MD contract: vendor ids. */
  readonly onChange: (v: string[]) => void
  /** Overrides the default edit right taken from the target entity's manager role. */
  readonly canManage?: boolean
}

const filters = [
  { name: { en: 'Name', de: 'Name' }, code: 'name' },
  { name: { en: 'ID', de: 'ID' }, code: 'id' },
]

/** Port of MD `components/shared/VendorsSelector` onto CL `PaginatedSelector`. */
const VendorsSelector = ({
  className,
  value,
  onChange,
  canManage,
}: VendorsSelectorProps) => {
  const { t } = useTranslation()
  const { getVendors } = useVendorsApi()
  const { hasPermission } = usePermissions()
  const { getUiLangValue } = useLocalizedValue()

  const resolveVendors = async (selected: string | string[]) => {
    const ids = Array.isArray(selected) ? selected : [selected]
    const { values } = await getVendors({
      currentPage: 1,
      rows: Math.max(ids.length, 1),
      filters: {
        id: { value: ids, matchMode: FilterMatchMode.EQUALS },
      },
    } as Partial<PaginationProps>)
    return values
  }

  const searchVendors = (params: DataTablePaginationState) =>
    getVendors(params as Partial<PaginationProps>)

  const itemTemplate = useCallback((item: Vendor) => item.name || item.id, [])

  return (
    <PaginatedSelector<Vendor>
      className={className}
      value={value}
      onChange={(next) => onChange(next as string[])}
      searchFn={searchVendors}
      resolveSelected={resolveVendors}
      canManage={canManage ?? hasPermission(EmployeeDomains.VENDORS_MANAGER)}
      canView={hasPermission(EmployeeDomains.VENDORS_VIEWER)}
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

export default VendorsSelector
